import { Testimonial } from "../../../models/testimonial/testimonial.model.js";

const getTestimonials = async (req, res) => {
  try {
    const { sort_by, product_short_id } = req.query;

    let testimonials = await Testimonial.find({
      is_visible: true,
      seller: req?.seller?._id,
    });

    if (sort_by === "product_wise" && product_short_id) {
      testimonials.sort((a, b) => {
        const aMatches = a?.product_code === product_short_id;
        const bMatches = b?.product_code === product_short_id;

        return Number(bMatches) - Number(aMatches);
      });
    }

    return res.status(200).json({ data: testimonials });
  } catch (error) {
    console.error("Error fetching testimonials:", error);
    return res.status(500).json({ error: error?.message });
  }
};

export { getTestimonials };
