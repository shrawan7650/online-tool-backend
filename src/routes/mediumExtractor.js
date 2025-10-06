import axios from 'axios'
import * as cheerio from 'cheerio';
import { Router } from 'express';
const router = Router();

router.post('/', async (req, res) => { // Remove /api from here
    try {
        const { url } = req.body;
        
        if (!url || !url.includes('medium.com')) {
            return res.status(400).json({ error: 'Please provide a valid Medium URL' });
        }

        // Add protocol if missing
        let targetUrl = url;
        if (!targetUrl.startsWith('http')) {
            targetUrl = 'https://' + targetUrl;
        }

        console.log('Fetching URL:', targetUrl);

        const response = await axios.get(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            },
            timeout: 10000
        });
        
        const $ = cheerio.load(response.data);

        // Extract article data
        const articleData = {
            title: $('h1').first().text().trim() || 'No title found',
            content: '',
            author: $('meta[name="author"]').attr('content') || 'Unknown Author',
            publishedTime: $('meta[property="article:published_time"]').attr('content') || '',
            readingTime: $('[data-testid="storyReadTime"]').text().trim() || '',
            subtitle: $('meta[property="og:description"]').attr('content') || '',
            featuredImage: $('meta[property="og:image"]').attr('content') || ''
        };

        // Extract content
        let content = '';
        $('article p').each((i, elem) => {
            const text = $(elem).text().trim();
            if (text && text.length > 20) {
                content += `<p>${text}</p>`;
            }
        });

        articleData.content = content || '<p>Could not extract content</p>';

        res.json(articleData);
        
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ 
            error: 'Failed to extract article. Please check the URL and try again.' 
        });
    }
});

export default router;