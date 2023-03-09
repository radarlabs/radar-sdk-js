import Http from '../http';

class Addresses {
  static async validateAddress(addressOptions={}) {
    let {
      country,
      state,
      city,
      number,
      postalCode,
      street,
      unit // optional
    } = addressOptions;

    const params = {
      country,
      state,
      city,
      number,
      postalCode,
      street,
      unit
    };

    return Http.request('GET', 'addresses/validate', params);
  }
}

export default Addresses;
