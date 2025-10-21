// GitHub API Helper untuk Premium Store
class GitHubStoreAPI {
    constructor(username, repository, token) {
        this.username = username;
        this.repository = repository;
        this.token = token;
        this.baseURL = 'https://api.github.com';
    }

    // Read file from GitHub
    async readFile(filePath) {
        try {
            const response = await fetch(
                `${this.baseURL}/repos/${this.username}/${this.repository}/contents/${filePath}`,
                {
                    headers: {
                        'Authorization': `token ${this.token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to read file: ${response.status}`);
            }

            const fileData = await response.json();
            const content = atob(fileData.content);
            return {
                data: JSON.parse(content),
                sha: fileData.sha
            };
        } catch (error) {
            console.error('Error reading file:', error);
            throw error;
        }
    }

    // Write file to GitHub
    async writeFile(filePath, content, commitMessage) {
        try {
            // Get current file to get SHA
            let sha = null;
            try {
                const currentFile = await this.readFile(filePath);
                sha = currentFile.sha;
            } catch (error) {
                // File doesn't exist, that's fine
            }

            const response = await fetch(
                `${this.baseURL}/repos/${this.username}/${this.repository}/contents/${filePath}`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `token ${this.token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/vnd.github.v3+json'
                    },
                    body: JSON.stringify({
                        message: commitMessage,
                        content: btoa(JSON.stringify(content, null, 2)),
                        sha: sha
                    })
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`GitHub API error: ${errorData.message}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error writing file:', error);
            throw error;
        }
    }

    // Add new product
    async addProduct(productData) {
        const filePath = 'databases/products.json';
        
        try {
            const { data, sha } = await this.readFile(filePath);
            
            // Add new product
            data.products.push(productData);
            data.metadata.total_products = data.products.length;
            data.metadata.last_updated = new Date().toISOString();

            // Save back to GitHub
            await this.writeFile(
                filePath, 
                data, 
                `Add new product: ${productData.name}`
            );

            return { success: true, message: 'Product added successfully' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    // Add new order
    async addOrder(orderData) {
        const filePath = 'databases/orders.json';
        
        try {
            const { data, sha } = await this.readFile(filePath);
            
            // Add new order
            data.orders.push(orderData);
            data.metadata.total_orders = data.orders.length;
            data.metadata.total_revenue = data.orders.reduce((sum, order) => sum + order.total_amount, 0);
            data.metadata.last_updated = new Date().toISOString();

            // Save back to GitHub
            await this.writeFile(
                filePath, 
                data, 
                `Add new order: ${orderData.order_id}`
            );

            return { success: true, message: 'Order added successfully' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
}
