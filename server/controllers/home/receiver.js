const Donor = require('../../models/Donor');

const receiver = async (req, res) => {
    const { bloodGroup, country, state, district, city } = req.body;

    // Type check inputs to prevent NoSQL object injection
    if (
        typeof bloodGroup !== 'string' ||
        typeof country !== 'string' ||
        typeof state !== 'string' ||
        typeof district !== 'string' ||
        typeof city !== 'string'
    ) {
        return res.status(400).json({ message: 'Invalid search parameters', status: false });
    }

    try {
        const donors = await Donor.find({
            bloodGroup: String(bloodGroup),
            country: String(country),
            state: String(state),
            district: String(district),
            city: String(city),
        }).select('fullName email mobileNumber');

        res.status(200).json(donors);
    } catch (err) {
        console.error('Search failed:', err.message);
        res.status(500).json({ message: 'Search failed', status: false });
    }
};

module.exports = receiver;
