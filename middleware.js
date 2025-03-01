// Middleware to handle CORS
const allowCors = (fn) => async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  
  // Get the requesting origin
  const origin = req.headers.origin;
  
  // Set the allowed origins
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000', 
    'https://gptstir.vercel.app',
  ];
  
  // Check if the request origin is in our allowed list
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    // For preflight requests, allow any origin for easier debugging
    // For production, you would want to be more strict
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  // Define allowed methods
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  
  // Define allowed headers
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );
  
  // Handle OPTIONS method for preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // Call the actual handler
  return await fn(req, res);
};

module.exports = allowCors; 