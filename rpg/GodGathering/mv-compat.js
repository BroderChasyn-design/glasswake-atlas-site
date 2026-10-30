(function() {
  if (!Array.prototype.flatMap) {
    Array.prototype.flatMap = function(callback, thisArg) {
      var result = [];
      for (var i = 0; i < this.length; i++) {
        var part = callback.call(thisArg, this[i], i, this);
        if (Array.isArray(part)) result = result.concat(part);
        else result.push(part);
      }
      return result;
    };
  }
  if (!Object.fromEntries) {
    Object.fromEntries = function(entries) {
      var result = {};
      for (var i = 0; i < entries.length; i++) result[entries[i][0]] = entries[i][1];
      return result;
    };
  }
  if (!Element.prototype.replaceChildren) {
    Element.prototype.replaceChildren = function() {
      while (this.firstChild) this.removeChild(this.firstChild);
      for (var i = 0; i < arguments.length; i++) {
        var child = arguments[i];
        this.appendChild(child instanceof Node ? child : document.createTextNode(String(child)));
      }
    };
  }
})();
