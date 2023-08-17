import { Router } from 'itty-router';
import { query } from './src/query';
// Create a new router
const router = Router();

/*
Our index route, a simple hello world.
*/
router.get('/', () => {
	return new Response('Hello, world! This is the root page of your Worker template.');
});
router.get('/capabilities', (req) => {
	return new Response(
		JSON.stringify({
			versions: '^0.1.0',
			capabilities: {
				query: { relation_comparisons: {}, order_by_aggregate: {}, foreach: {} },
				mutations: { nested_inserts: {}, returning: {} },
				relationships: {},
			},
		}),
		{
			headers: {
				'Content-Type': 'application/json',
			},
		}
	);
});

router.get('/schema', (req) => {
	return new Response(
		JSON.stringify({
			scalar_types: {
				Int: {
					aggregate_functions: {
						max: {
							result_type: {
								type: 'nullable',
								underlying_type: { type: 'named', name: 'Int' },
							},
						},
						min: {
							result_type: {
								type: 'nullable',
								underlying_type: { type: 'named', name: 'Int' },
							},
						},
					},
					comparison_operators: {},
					update_operators: {},
				},
				String: {
					aggregate_functions: {},
					comparison_operators: {
						like: { argument_type: { type: 'named', name: 'String' } },
					},
					update_operators: {},
				},
			},
			object_types: {
				article: {
					description: 'An article',
					fields: {
						author_id: {
							description: "The article's author ID",
							arguments: {},
							type: { type: 'named', name: 'Int' },
						},
						id: {
							description: "The article's primary key",
							arguments: {},
							type: { type: 'named', name: 'Int' },
						},
						title: {
							description: "The article's title",
							arguments: {},
							type: { type: 'named', name: 'String' },
						},
					},
				},
				author: {
					description: 'An author',
					fields: {
						first_name: {
							description: "The author's first name",
							arguments: {},
							type: { type: 'named', name: 'String' },
						},
						id: {
							description: "The author's primary key",
							arguments: {},
							type: { type: 'named', name: 'Int' },
						},
						last_name: {
							description: "The author's last name",
							arguments: {},
							type: { type: 'named', name: 'String' },
						},
					},
				},
			},
			collections: [
				{
					name: 'articles',
					description: 'A collection of articles',
					arguments: {},
					type: 'article',
					deletable: false,
					uniqueness_constraints: { ArticleByID: { unique_columns: ['id'] } },
					foreign_keys: {},
				},
				{
					name: 'authors',
					description: 'A collection of authors',
					arguments: {},
					type: 'author',
					deletable: false,
					uniqueness_constraints: { AuthorByID: { unique_columns: ['id'] } },
					foreign_keys: {},
				},
				{
					name: 'articles_by_author',
					description: 'Articles parameterized by author',
					arguments: { author_id: { type: { type: 'named', name: 'Int' } } },
					type: 'article',
					deletable: false,
					uniqueness_constraints: {},
					foreign_keys: {},
				},
			],
			functions: [
				{
					name: 'latest_article_id',
					description: 'Get the ID of the most recent article',
					arguments: {},
					result_type: {
						type: 'nullable',
						underlying_type: { type: 'named', name: 'Int' },
					},
				},
			],
			procedures: [
				{
					name: 'upsert_article',
					description: 'Insert or update an article',
					arguments: {
						article: {
							description: 'The article to insert or update',
							type: { type: 'named', name: 'article' },
						},
					},
					result_type: {
						type: 'nullable',
						underlying_type: { type: 'named', name: 'article' },
					},
				},
			],
		}),
		{
			headers: {
				'Content-Type': 'application/json',
			},
		}
	);
});

router.post('/query', async (req) => {
	let json = await req.json();
	return new Response(JSON.stringify(query(json)), {
		headers: {
			'Content-Type': 'application/json',
		},
	});
});

router.post('/mutations', () => {
	throw new Error('Not implemented');
});

router.post('/explain', () => {
	throw new Error('Not implemented');
});

router.get('/metrics', (req) => {
	return new Response(
		JSON.stringify({ 'Total requests': 0 }),
		{
			headers: {
				'Content-Type': 'application/json',
			},
		}
	);
});

router.get('/healthz', (req) => {
	// send just ok as a plain text
	return new Response('OK');
});

/*
This route demonstrates path parameters, allowing you to extract fragments from the request
URL.

Try visit /example/hello and see the response.
*/
router.get('/example/:text', ({ params }) => {
	// Decode text like "Hello%20world" into "Hello world"
	let input = decodeURIComponent(params.text);

	// Serialise the input into a base64 string
	let base64 = btoa(input);

	// Return the HTML with the string to the client
	return new Response(`<p>Base64 encoding: <code>${base64}</code></p>`, {
		headers: {
			'Content-Type': 'text/html',
		},
	});
});

/*
This shows a different HTTP method, a POST.

Try send a POST request using curl or another tool.

Try the below curl command to send JSON:

$ curl -X POST <worker> -H "Content-Type: application/json" -d '{"abc": "def"}'
*/
router.post('/post', async request => {
	// Create a base object with some fields.
	let fields = {
		asn: request.cf.asn,
		colo: request.cf.colo,
	};

	// If the POST data is JSON then attach it to our response.
	if (request.headers.get('Content-Type') === 'application/json') {
		let json = await request.json();
		Object.assign(fields, { json });
	}

	// Serialise the JSON to a string.
	const returnData = JSON.stringify(fields, null, 2);

	return new Response(returnData, {
		headers: {
			'Content-Type': 'application/json',
		},
	});
});

/*
This is the last route we define, it will match anything that hasn't hit a route we've defined
above, therefore it's useful as a 404 (and avoids us hitting worker exceptions, so make sure to include it!).

Visit any page that doesn't exist (e.g. /foobar) to see it in action.
*/
router.all('*', () => new Response('404, not found!', { status: 404 }));

export default {
	fetch: router.handle,
};
