import axios from 'axios';
import { showAlert } from './alerts.js';
const stripe = Stripe(
  'pk_test_51OWKBJKkqUnKJ1TaE9JojDIhPWRo8BUlnP2c9MnrAt470RmJsAmEmyS4pY0c4TkSyIqKjR08ycNfnet4y8yRvoTY00t3p1tDmV',
);
export const bookTour = async (tourId) => {
  try {
    // get checkout session
    const session = await axios(
      `/api/v1/booking/checkout-session/${tourId}`,
    );

    // render checkout form
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    showAlert('error', err.message);
  }
};
