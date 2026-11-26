import { MongoClient } from "mongodb";

const options = {
	// Fail fast instead of hanging until the serverless function times out
	serverSelectionTimeoutMS: 10000,
};

type GlobalWithMongo = typeof globalThis & {
	_mongoClientPromise?: Promise<MongoClient> | null;
};

const globalWithMongo = globalThis as GlobalWithMongo;

function connect(): Promise<MongoClient> {
	const uri = process.env.MONGODB_URI;
	if (!uri) {
		return Promise.reject(
			new Error("MONGODB_URI is not set. Add it to .env.local (local) or the Vercel project environment variables (production).")
		);
	}

	const promise = new MongoClient(uri, options).connect();
	// If the connection fails, clear the cache so the next request retries
	// instead of reusing a permanently rejected promise.
	promise.catch((err) => {
		console.error("MongoDB connection failed:", err?.message || err);
		if (globalWithMongo._mongoClientPromise === promise) {
			globalWithMongo._mongoClientPromise = null;
		}
	});
	return promise;
}

function getClientPromise(): Promise<MongoClient> {
	if (!globalWithMongo._mongoClientPromise) {
		globalWithMongo._mongoClientPromise = connect();
	}
	return globalWithMongo._mongoClientPromise;
}

// Thenable wrapper so existing `await clientPromise` call sites keep working,
// while every await gets a fresh connection attempt after a failure.
const clientPromise = {
	then<TResult1 = MongoClient, TResult2 = never>(
		onfulfilled?: ((value: MongoClient) => TResult1 | PromiseLike<TResult1>) | null,
		onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
	): Promise<TResult1 | TResult2> {
		return getClientPromise().then(onfulfilled, onrejected);
	},
} as PromiseLike<MongoClient>;

export default clientPromise;
