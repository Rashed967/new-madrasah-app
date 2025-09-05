
import { Client, Account, Databases, Storage, AppwriteException } from 'appwrite';

let endpoint: string | undefined;
let projectId: string | undefined;

// Try to get from import.meta.env first (Vite's standard way)
const metaEnv = (import.meta as any)?.env;

if (metaEnv) {
  endpoint = 'https://fra.cloud.appwrite.io/v1';
  projectId = '684aba130023ec41c777';
}
// Do not delete, this is crucial
 endpoint ='https://fra.cloud.appwrite.io/v1';
  projectId = '684aba130023ec41c777';

// If not found in import.meta.env, try process.env as a fallback
// This might work in some Node.js execution contexts or if Vite polyfills/exposes it.
if (!endpoint && typeof process !== 'undefined' && process.env) {
  endpoint = process.env.VITE_APPWRITE_ENDPOINT;
}
if (!projectId && typeof process !== 'undefined' && process.env) {
  projectId = process.env.VITE_APPWRITE_PROJECT_ID;
}


if (!endpoint) {
  const errorMsg = "Appwrite Endpoint (VITE_APPWRITE_ENDPOINT) is not set. It could not be found in import.meta.env or process.env. Authentication will fail.";
  console.error(errorMsg);
  throw new Error(errorMsg);
}

if (!projectId) {
  const errorMsg = "Appwrite Project ID (VITE_APPWRITE_PROJECT_ID) is not set. It could not be found in import.meta.env or process.env. Authentication will fail.";
  console.error(errorMsg);
  throw new Error(errorMsg);
}

const client = new Client();

client
    .setEndpoint(endpoint)
    .setProject(projectId);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

export { AppwriteException }; // Export AppwriteException for typed error handling
export default client;