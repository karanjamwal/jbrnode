// Configure Endpoints
export let collectionDefinition;
export let blobFileContainer;

let environment = process.env.NODE_ENV || 'production';
console.log(`Running as ${environment} environment`);

switch (environment) {
    case 'development':
        collectionDefinition = 'dev';
        blobFileContainer = 'dev-dashboard';
        break;
    case 'production':
    default:
        collectionDefinition = 'prod';
        blobFileContainer = 'scott-services-dashboard';
        break;
}

// Configure Azure DocumentDB
export const endpoint = 'https://scottservices-documentdb.documents.azure.com:443/';
export const authKey = 'obxuXuPtVm1DTnYXGV4t1IH9LVztCsotfEDtptxSg0yoBqvcRsYf3FTnE99ilNg4q7fSJeYpKpekIPy60zeSWA==';

// Setup Database and Collection
export const dbDefinition = 'scott-services-dashboard';

// Setup Blob Service
export const blobStorageAccount = 'scottservicesstorage';
export const blobAccessKey = 'E7vxh7Kwit03PMjnhU/hAGyYbRwnMgwN7XjzJa4CivRu+4h1+XnN+CyY6LGtayrW8VkGJGo1guBuwJv/i1/nbg==';
export const blobEndpoint = `https://${blobStorageAccount}.blob.core.windows.net/${blobFileContainer}/`;
                            
// Configure Cryptography
export const cryptoKey = "873e923c756a712b";
export const cryptoIv = "e87f12384b93e78c";

// PushPad
export const pushpad_auth_token: string = "8989ab3d126b83fe530fa128672c72ad"; // Dev
export const pushpad_project_id: number = 2717; // Dev
