const getCustomerData = async (req, res) => {
  try {
    if (req?.customer) {
      return res.status(200).json({
        data: {
          customer: req?.customer,
        },
      });
    } else {
      return res.status(200).json({
        data: {
          customer: null,
        },
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error?.message });
  }
};

export { getCustomerData };
