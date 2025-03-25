const axios = require('axios');
const cheerio = require('cheerio');

async function getPinterestContent(url) {
    try {
        // Convert short pin.it URL to full URL if needed
        let fullUrl = url;
        if (url.includes('pin.it')) {
            const redirectResponse = await axios.get(url, {
                maxRedirects: 0,
                validateStatus: status => status >= 200 && status < 400
            });
            fullUrl = redirectResponse.headers.location || url;
        }

        // Handle both in.pinterest.com and pinterest.com domains
        fullUrl = fullUrl.replace('in.pinterest.com', 'pinterest.com');

        const response = await axios.get(fullUrl, {
            headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        const $ = cheerio.load(response.data);
        
        // Extract video
        const videoElement = $('video');
        const videoUrl = videoElement.attr('src');
        
        // Extract image
        const imageElement = $('img.hCL.kVc.L4E.MI');
        const imageUrl = imageElement.attr('src');

        return {
            success: true,
            data: {
                video: videoUrl || null,
                image: imageUrl || null,
                type: videoUrl ? 'video' : 'image'
            }
        };

    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

module.exports = async (req, res) => {
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({
            success: false,
            message: 'Please provide a Pinterest URL'
        });
    }

    const result = await getPinterestContent(url);
    
    // Example Response Format
    if (result.success) {
        res.status(200).json({
            status: 'success',
            message: 'Content retrieved successfully',
            data: {
                type: result.data.type,
                url: result.data.video || result.data.image,
                timestamp: new Date().toISOString()
            }
        });
    } else {
        res.status(500).json({
            status: 'error',
            message: 'Failed to retrieve content',
            error: result.error
        });
    }
};
