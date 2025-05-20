export default async function handler(req, res) {
  const { username, password, action = 'player_api' } = req.query;
  const baseUrl = 'http://b3.dinott.com';

  const url = `${baseUrl}/${action}.php?username=${username}&password=${password}`;

  try {
    const response = await fetch(url);
    const data = await response.text();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).send(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch data from IPTV server.' });
  }
}