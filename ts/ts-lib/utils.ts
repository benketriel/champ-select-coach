


export class Utils {

  public static arraysEqual(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length !== b.length) return false;

    for (var i = 0; i < a.length; ++i) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

  public static arraysEqualSkipLeftNulls(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length !== b.length) return false;

    for (var i = 0; i < a.length; ++i) {
      if (a[i] !== b[i] && a[i] != null) return false;
    }
    return true;
  }

  public static flattenArray(arr: any[]) {
    return arr.reduce(function (flat, toFlatten) {
      return flat.concat(Array.isArray(toFlatten) ? Utils.flattenArray(toFlatten) : toFlatten);
    }, []);
  }

  public static sum(arr: number[]) {
    return arr.reduce((a, b) => a + b, 0);
  }

  public static avg(arr: number[]) {
    return this.sum(arr) / arr.length;
  }

  public static max(arr: number[]) {
    return arr.reduce((a, b) => Math.max(a,b), arr[0]);
  }

  public static groupByCount(xs) {
    return xs.reduce(function(rv, x) {
      rv[x] = (rv[x] || 0) + 1;
      return rv;
    }, {});
  }

  public static groupByLambda(xs, func) {
    return xs.reduce(function(rv, x) {
      (rv[func(x)] = rv[func(x)] || []).push(x);
      return rv;
    }, {});
  }

  public static setsAreEqual(as, bs) {
    if (as.size !== bs.size) return false;
    for (var a of as) if (!bs.has(a)) return false;
    return true;
  }

  public static setIncludes(as, bs) {
    for (var b of bs) if (!as.has(b)) return false;
    return true;
  }

  public static mergeDicts(a: object, b: object) {
    const c = {};
    for (let k in a) {
      c[k] = a[k];
    }
    for (let k in b) {
      c[k] = b[k];
    }
    return c;
  }



}