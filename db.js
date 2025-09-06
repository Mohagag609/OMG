export const DB_NAME = 'estate_pro_db';
export const DB_VERSION = 1;
export let db;

export const OBJECT_STORES = [
    'customers', 'units', 'partners', 'unitPartners', 'contracts', 'installments',
    'partnerDebts', 'safes', 'transfers', 'auditLog', 'vouchers', 'brokerDues',
    'brokers', 'partnerGroups', 'settings', 'keyval' // 'keyval' for misc data like migration status
];

export function openDB() {
    return new Promise((resolve, reject) => {
        if (db) {
            return resolve(db);
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            console.error('Database error:', event.target.error);
            reject('Database error: ' + event.target.error);
        };

        request.onupgradeneeded = (event) => {
            const dbInstance = event.target.result;
            console.log('Running onupgradeneeded');

            OBJECT_STORES.forEach(storeName => {
                if (!dbInstance.objectStoreNames.contains(storeName)) {
                    if (storeName === 'settings' || storeName === 'keyval') {
                        dbInstance.createObjectStore(storeName, { keyPath: 'key' });
                    } else {
                        dbInstance.createObjectStore(storeName, { keyPath: 'id' });
                    }
                    console.log(`Object store created: ${storeName}`);
                }
            });
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            console.log('Database opened successfully.');
            resolve(db);
        };
    });
}

export function getAll(storeName) {
    return new Promise((resolve, reject) => {
        openDB().then(db => {
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();
            request.onsuccess = () => { resolve(request.result); };
            request.onerror = (event) => { reject(event.target.error); };
        }).catch(reject);
    });
}

export function put(storeName, item) {
    return new Promise((resolve, reject) => {
        openDB().then(db => {
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(item);
            request.onsuccess = () => { resolve(request.result); };
            request.onerror = (event) => { reject(event.target.error); };
        }).catch(reject);
    });
}

export async function getKeyVal(key) {
    return new Promise((resolve, reject) => {
        openDB().then(db => {
            const transaction = db.transaction('keyval', 'readonly');
            const store = transaction.objectStore('keyval');
            const request = store.get(key);
            request.onsuccess = () => { resolve(request.result ? request.result.value : undefined); };
            request.onerror = (event) => { reject(event.target.error); };
        }).catch(reject);
    });
}

export async function setKeyVal(key, value) {
    return put('keyval', { key, value });
}
