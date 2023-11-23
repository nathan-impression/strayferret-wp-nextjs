const mysql = require('mysql');

export default class database {
	pool = null;

	async query($sql) {
		return new Promise((resolve, reject) => {
			// console.log('Make query');

			const connectionParams = {
				connectionLimit:
					process.env.WORDPRESS_DATABASE_CONNECTION_LIMIT,
				host: process.env.WORDPRESS_DATABASE_HOST,
				port: process.env.WORDPRESS_DATABASE_PORT_NUMBER,
				user: process.env.WORDPRESS_DATABASE_USER,
				password: process.env.WORDPRESS_DATABASE_NAME,
				database: process.env.WORDPRESS_DATABASE_PASSWORD,
			};
			// console.log('connect with', connectionParams);
			const connection = mysql.createConnection(connectionParams);
			connection.query($sql, (err, results, fields) => {
				if (err) {
					// console.error('error connecting: ' + err.stack);
					// console.log('connectionParams:  ' + connectionParams);
					reject(err);
				}

				resolve(results);
			});
			connection.end();
		});
	}
}
