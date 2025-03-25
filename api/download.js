const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide a Pinterest URL'
      });
    }

    // Normalize URL formats
    let normalizedUrl = url;
    if (url.includes('pin.it')) {
      // Handle short URLs by following redirect
      const redirectResponse = await axios.get(url, {
        maxRedirects: 0,
        validateStatus: (status) => status >= 200 && status < 400,
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      normalizedUrl = redirectResponse.headers.location || url;
    }

    // Convert in.pinterest.com to pinterest.com
    normalizedUrl = normalizedUrl.replace('in.pinterest.com', 'pinterest.com');

    // Fetch the Pinterest page
    const response = await axios.get(normalizedUrl, {
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    
    // Extract media URL
    let mediaUrl = '';
    let mediaType = '';

    // Try to find video
    const videoElement = $('video');
    if (videoElement.length > 0) {
      mediaUrl = videoElement.attr('src') || '';
      mediaType = 'video';
    } else {
      // Try to find image
      const imageElement = $('img.h-full.w-full');
      mediaUrl = imageElement.attr('src') || '';
      mediaType = 'image';
    }

    if (!mediaUrl) {
      return res.status(404).json({
        status: 'error',
        message: 'No downloadable media found'
      });
    }

    // Example Response Format
    res.status(200).json({
      status: 'success',
      url: mediaUrl,
      type: mediaType,
      originalUrl: normalizedUrl,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to process request',
      error: error.message
    });
  }
};
