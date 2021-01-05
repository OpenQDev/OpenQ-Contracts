export default {
  methods: {
    getAge(createdAt) {
      return (new Date().getTime() - new Date(createdAt).getTime()) / (60 * 60 * 24 * 1000)
    },
    daysBetween(first, second) {
      // Copy date parts of the timestamps, discarding the time parts.
      var one = new Date(first.getFullYear(), first.getMonth(), first.getDate());
      var two = new Date(second.getFullYear(), second.getMonth(), second.getDate());

      // Do the math.
      var millisecondsPerDay = 1000 * 60 * 60 * 24;
      var millisBetween = two.getTime() - one.getTime();
      var days = millisBetween / millisecondsPerDay;

      // Round down.
      return Math.floor(days);
    },
    brightnessByColor(color) {
      var color = "" + color, isHEX = color.indexOf("#") == 0, isRGB = color.indexOf("rgb") == 0;
      if (isHEX) {
        const hasFullSpec = color.length == 7;
        var m = color.substr(1).match(hasFullSpec ? /(\S{2})/g : /(\S{1})/g);
        if (m) var r = parseInt(m[0] + (hasFullSpec ? '' : m[0]), 16), g = parseInt(m[1] + (hasFullSpec ? '' : m[1]), 16), b = parseInt(m[2] + (hasFullSpec ? '' : m[2]), 16);
      }
      if (isRGB) {
        var m = color.match(/(\d+){3}/g);
        if (m) var r = m[0], g = m[1], b = m[2];
      }
      if (typeof r != "undefined") return ((r*299)+(g*587)+(b*114))/1000;
    }
  }
}
