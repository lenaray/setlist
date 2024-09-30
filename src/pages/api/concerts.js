import axios from 'axios';

export default async function handler(req, res) {
    const { lat, lon } = req.query;
    const TICKETMASTER_API_KEY = process.env.NEXT_PUBLIC_TICKETMASTER_API_KEY

    try {
        const response = await axios.get(`https://app.ticketmaster.com/discovery/v2/events.json`, {
            params: {
                // latlong: `${lat},${lon}`,
                apiKey: TICKETMASTER_API_KEY,
            },
        });

        const events = response.data._embedded.events;
        res.status(200).json({ events });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching concert data'});
    }
}