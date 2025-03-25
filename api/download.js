const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async (req, res) => {
  // Enable CORS (optional, for frontend access)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  // Get the Pinterest URL from query parameters
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Please provide a Pinterest URL' });
  }

  try {
    // Custom headers as requested
    const headers = {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    };

    // Handle short URLs (e.g., pin.it) by following redirects
    let finalUrl = url;
    if (url.includes('pin.it')) {
      const redirectResponse = await axios.get(url, { headers, maxRedirects: 0, validateStatus: (status) => status >= 200 && status < 400 });
      finalUrl = redirectResponse.headers.location || url;
    }

    // Ensure the URL is a valid Pinterest pin URL
    if (!finalUrl.match(/^(https?:\/\/)?(www\.)?(in\.)?pinterest\.com\/pin\/\d+/)) {
      return res.status(400).json({ error: 'Invalid Pinterest URL' });
    }

    // Fetch the Pinterest page
    const { data } = await axios.get(finalUrl, { headers });
    const $ = cheerio.load(data);

    // Extract media (image or video)
    let mediaUrl = '';
    const videoElement = $('video source');
    const imageElement = $('img[src*="pinimg.com"]');

    if (videoElement.length > 0) {
      mediaUrl = videoElement.attr('src');
    } else if (imageElement.length > 0) {
      mediaUrl = imageElement.attr('src');
    } else {
      return res.status(404).json({ error: 'No media found in the provided URL' });
    }

    // Example Response as requested
    const response = {
      status: 'success',
      originalUrl: finalUrl,
      mediaType: videoElement.length > 0 ? 'video' : 'image',
      mediaUrl: mediaUrl,
      timestamp: new Date().toISOString()
    };

    res.status(200).json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch media', details: error.message });
  }
};
