// Wrapper to allow running `node server.js` from the `roomhy-backend` folder.
// It simply requires the root server file.
try {
    require('../server.js');
} catch (err) {
    console.error('Failed to start server from roomhy-backend folder. Please run from repo root or ensure files exist.');
    console.error(err);
    process.exit(1);
}
