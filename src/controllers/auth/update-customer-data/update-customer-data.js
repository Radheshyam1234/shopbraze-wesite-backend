import { Customer } from "../../../models/user/customer.model.js";

const updateCustomerData = async (req, res) => {
  try {
    const { name, address } = req.body;

    const customer = await Customer.findById(req?.customer?._id);
    if (!customer) {
      return res.status(401).json({ error: "Unauthorized customer" });
    }

    if (name) customer.name = name;
    if (address) customer.address = address;

    await customer.save();

    res.status(200).json({ message: "Customer data updated", customer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error?.message });
  }
};

export { updateCustomerData };
