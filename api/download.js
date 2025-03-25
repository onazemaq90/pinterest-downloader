const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async (req, res) => {
  try {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    
    // Get URL from query parameter
    let { url } = req.query;
    if (!url) {
      return res.status(400).json({ error: 'Please provide a Pinterest URL' });
    }

    // Normalize URL variations
    url = url.replace('pin.it', 'pinterest.com')
             .replace('in.pinterest.com', 'pinterest.com');

    // Ensure URL has protocol
    if (!url.startsWith('http')) {
      url = 'https://' + url;
    }

    // Fetch Pinterest page
    const response = await axios.get(url, {
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    const html = response.data;
    const $ = cheerio.load(html);

    // Extract media URL
    let mediaUrl;
    const videoElement = $('video').attr('src');
    const imageElement = $('meta[property="og:image"]').attr('content');

    if (videoElement) {
      mediaUrl = videoElement;
    } else if (imageElement) {
      mediaUrl = imageElement;
    } else {
      return res.status(404).json({ error: 'No media found in the Pinterest URL' });
    }

    // Example response structure
    const responseData = {
      success: true,
      type: videoElement ? 'video' : 'image',
      url: mediaUrl,
      originalUrl: url,
      timestamp: new Date().toISOString()
    };

    res.status(200).json(responseData);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Failed to process request',
      message: error.message
    });
  }
};
