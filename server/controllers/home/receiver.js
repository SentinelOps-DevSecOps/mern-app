const Donor = require('../../models/Donor');

const receiver = async (req, res) => {
    const { bloodGroup, country, state, district, city } = req.body;

    try {
        const donors = await Donor.find({
            bloodGroup,
            country,
            state,
            district,
            city,
        }).select('fullName email  mobileNumber');

        res.status(200).json(donors);
    } catch (err) {
        res.status(500).json({ message: 'Search failed', error: err.message });
    }
};

module.exports = receiver;
