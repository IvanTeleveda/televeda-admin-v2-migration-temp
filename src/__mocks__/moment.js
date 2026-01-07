const moment = jest.requireActual("moment");
moment.tz = {
  guess: () => "America/New_York",
};
module.exports = moment;
