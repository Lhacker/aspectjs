; (function (global, undefined) {

  //--------------------------------------------------
  // public
  //--------------------------------------------------
  /**
   * Aspect class.
   * @constructor
   * @example
   *  new Aspect()
   *    .before(function(a) { console.log(a); }, "a")
   *      .target(function(msg) { alert(msg); }, "target")
   *    .before(function(b) { console.log(b) }, "b")
   *    .execute();
   */
  global.Aspect = function() {
    this._beforeFuncs = [];
    this._targetFunc = null;
    this._asyncTarget = false;  // async function flag
    this._afterFuncs = [];
  }

  /**
   * set before function.
   * @return {object} self object
   */
global.Aspect.prototype.before = function() {
    if (_isFunction(arguments[0])) {
      this._beforeFuncs.push(
        new _FuncData(arguments[0], _applyArraySlice(arguments, 1))
      );
    }
    return this;
  };

  /**
   * set target function.
   * @return {object} self object
   */
global.Aspect.prototype.target = function() {
    if (this._targetFunc)
      throw new Error("Target function is already set.");

    if (_isFunction(arguments[0])) {
      this._targetFunc = 
        new _FuncData(arguments[0], _applyArraySlice(arguments, 1));
    }
    return this;
  };

  /**
   * set target function(and execute asynchronous).
   * @return {object} self object
   */
global.Aspect.prototype.asyncTarget = function() {
    this._asyncTarget = true;
    this.target(arguments);
    return this;
  };

  /**
   * set after function.
   * @return {object} self object
   */
global.Aspect.prototype.after = function() {
    if (_isFunction(arguments[0])) {
      this._afterFuncs.push(
        new _FuncData(arguments[0], _applyArraySlice(arguments, 1))
      );
    }
    return this;
  };
  
  /**
   * set after function(ensure execute).
   * @return {object} self object
   */
  global.Aspect.prototype.afterEnsure = function() {
    if (_isFunction(arguments[0])) {
      this._afterFuncs.push(
        new _FuncData(arguments[0], _applyArraySlice(arguments, 1), true)
      );
    }
    return this;
  };

  /**
   * get executable aspected function.
   * @desc if this._asyncTarget == true,
   *  target function execute asynchronous(window.setTimeout(f, 0)).
   * @return {Function} aspected function
   */
  global.Aspect.prototype.getExecutableFunction = function() {
    var self = this;
  
    var executeTargetAndAfter = function(tf, afs, aefs) {
      var r = null;
      try {
        // execute target function
        r = tf.apply();
        // execute after functions
        for (var i = 0, l = afs.length; i < l; i++) afs[i].apply();
      } finally {
        // execute after ensured functions
        for (var i = 0, l = aefs.length; i < l; i++) aefs[i].apply();
      }
      return r;
    };

    return function() {
      var result = null;
      var afterFuncsTuple = _splitFuncsEnsuredOrNot(self._afterFuncs);

      // execute before functions
      for (var i = 0, l = self._beforeFuncs.length; i < l; i++) {
        self._beforeFuncs[i].apply();
      }
      
      if (this._asyncTarget) {
        // (async) execute target and after functions
        window.setTimeout(function() {
          result =
            executeTargetAndAfter(
              self._targetFunc, afterFuncsTuple[1], afterFuncsTuple[0]
            );
        }, 0);
      } else {
        // execute target and after functions
        result =
          executeTargetAndAfter(
            self._targetFunc, afterFuncsTuple[1], afterFuncsTuple[0]
          );
      }

      return result;
    };
  };
  
  /**
   * execute aspected function.
   * @return result value of execution
   */
  global.Aspect.prototype.execute = function() {
    return (this.getExecutableFunction())();
  };

  //--------------------------------------------------
  // private 
  //-------------------------------------------------- 
  /**
   * function data class.
   * @constructor
   * @param {Function}  func          function object
   * @param {Array}     params        function's valiable arguments
   * @param {Boolean}   ensureExecute whether ensure execute or not
   */
  var _FuncData = function(func, params, ensureExecute) {
    this._func = func;
    this._params = params;
    this._ensureExecute = ensureExecute ? true : false;
  };
  /**
   * judge ensured function or not.
   * @return {Boolean} whether ensure execute or not
   */
  _FuncData.prototype.isEnsured = function() {
      return this._ensureExecute;
  };
  /**
   * apply function.
   * @return functions result value
   */
  _FuncData.prototype.apply = function () {
    return this._func.apply(null, this._params);
  };

  /**
   * judge whether function or not.
   * @param   {object}  f function object
   * @return  {Boolean}   whether function or not
   */
  var _isFunction = function(f) {
    return f && (typeof f === "function" || f instanceof Function); 
  };

  /**
   * apply Array.slice(begin[, end]) to parameter object.
   * @param {object}  obj   apply object
   * @param {integer} begin begin index
   * @param {integer} end   end index
   */
  var _applyArraySlice = function(obj, begin, end) {
    return Array.prototype.slice.call(obj, begin, end);
  };

  /**
   * split Array.<_FuncData> into ensured and not ensured.
   * @param   {Array.<_FuncData>} funcs _FuncData array
   * @return  {Array.<Array.<_FuncData>, Array.<_FuncData>>} Tuple of _FuncData array
   * @example
   *  _splitFuncsEnsuredOrNot([
   *    new _FuncData(f1, null, true),
   *    new _FuncData(f2, null),
   *    new _FuncData(f3, null, true)])
   *      => [[new _FuncData(f1, null, true), new _FuncData(f3, null, true)],
   *          [new _FuncData(f2, null)]];
   */
  var _splitFuncsEnsuredOrNot = function(funcs) {
    var fsTuple = [[/* ensured funcs */], [/* normal funcs */]];
    for (var i = 0, l = funcs.length; i < l; i++) {
      if (funcs[i].isEnsured())
        fsTuple[0].push(funcs[i]);
      else
        fsTuple[1].push(funcs[i]);
    }
    return fsTuple;
  };

})(this);
