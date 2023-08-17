import authors from "../data/authors.json"
import articles from "../data/articles.json"

const collections = {
  authors,
  articles
}

const sort = (data, order_by) => {
  return data.sort((a, b) => {
    if (!order_by?.elements) {
      return 0
    }
    for (const orderBy of order_by.elements) {
      let aValue
      let bValue
      if (orderBy.target.type === "column") {
        aValue = a[orderBy.target.name]
        bValue = b[orderBy.target.name]
      }

      if (aValue === bValue) {
        continue
      }

      if (orderBy.order_direction === "asc") {
        return aValue < bValue ? -1 : 1
      }
      return aValue < bValue ? 1 : -1
    }
    return 0
  })
}

const filterRow = (row, where) => {
  if (where.type === "binary_comparison_operator") {
    let columnValue
    let value

    if (where.column.type === "column") {
      columnValue = row[where.column.name]
    } else {
      throw new Error("not implemented")
    }

    if (where.value.type === "scalar") {
      value = where.value.value
    } else {
      throw new Error("not implemented")
    }

    switch (where.operator.type) {
      case "equal":
        return columnValue === value
      case "other":
        if (where.operator.name === "like") {
          return columnValue.match(value)
        } else {
          throw new Error("not implemented")
        }
    }
  }
  if (where.type === "and") {
    const expressions = where.expressions
    return expressions.every(expression => filterRow(row, expression))
  }

  throw new Error("not implemented")
}

const filter = (data, where) => {
  if (!where) {
    return data
  }
  const filtered = data.filter(row => filterRow(row, where))

  return filtered
}

const map = (data, collection_relationships, fields) => {
  return data.map(row => {
    const newRow = {}
    for (const [key, field] of Object.entries(fields ?? {})) {
      if (field.type === "column") {
        newRow[key] = row[field.column]
      }
      if (field.type === "relationship") {
        // TODO: replace with a recursive call to query?
        const relationship = collection_relationships[field.relationship]
        if (relationship.relationship_type === "array") {
          const targetCollection = collections[relationship.target_collection]
          // TODO: replace with a call di filter?
          const filtered = targetCollection.filter(targetRow => {
            for (const [key, value] of Object.entries(
              relationship.column_mapping
            )) {
              if (targetRow[value] !== row[key]) {
                return false
              }
            }
            return true
          })

          const mapped = map(
            filtered,
            collection_relationships,
            field.query.fields
          )
          newRow[key] = {
            rows: mapped
          }
        } else if (relationship.relationship_type === "object") {
          const targetCollection = collections[relationship.target_collection]
          const filtered = targetCollection.filter(targetRow => {
            for (const [key, value] of Object.entries(
              relationship.column_mapping
            )) {
              if (targetRow[value] !== row[key]) {
                return false
              }
            }
            return true
          })
          const mapped = map(
            filtered,
            collection_relationships,
            field.query.fields
          )
          console.log("Mapped", filtered)

          newRow[key] = {
            rows: [mapped[0]]
          }
        }
      }
    }
    return newRow
  })
}

export const query = request => {
  console.log(JSON.stringify(request, null, 2))

  const data = collections[request.collection]
  const sorted = sort(data, request.query.order_by)
  const filtered = filter(sorted, request.query.where)
  const mapped = map(
    filtered,
    request.collection_relationships,
    request.query.fields
  )

  console.log(JSON.stringify(mapped, null, 2))

  return [
    {
      rows: mapped
    }
  ]
}
