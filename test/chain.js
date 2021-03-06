describe('chaining an Api', function() {
  var assert = require('assert');
  var Api = require('./fixtures/api.js');
  var chainit = require('../index.js');
  var ChainApi;
  var o;

  beforeEach(function() {
    ChainApi = chainit(Api);
    o = new ChainApi();
  });

  // theses tests relates to task push() flushingF
  describe('before calls', function() {
    var ChainApi = chainit(Api);
    var b = new ChainApi();

    it('are supported', function(done) {
      b.slowConcat('cou0').slowConcat('cou1');
      setImmediate(function() {
        b.concat('bouh0').concat('bouh1', function() {
          assert.equal(b.s, 'cou0cou1bouh0bouh1')
          done();
        });
      });
    });
  });

  describe('mocha without before', function() {
    var ChainApi = chainit(Api);
    var b = new ChainApi();

    b.slowConcat('cou0').slowConcat('cou1');

    it('supports it', function(done) {
      b.concat('bouh0').concat('bouh1', function() {
        assert.equal(b.s, 'cou0cou1bouh0bouh1')
        done();
      })
    });
  });

  describe('nexticks, timeout', function () {
    it('works with after nexttick', function(done) {
      o.slowConcat('cou0').slowConcat('cou1');

      process.nextTick(function(){
        o.concat('bouh0', function() {
          assert.equal('cou0cou1bouh0', o.s);
          done();
        });
      });
    });

    it('works with double nexttick', function(done) {
      o.slowConcat('cou0');

      process.nextTick(function(){
        o.slowConcat('cou1').concat('cou2');
      });

      process.nextTick(function(){
        o
          .concat('bouh1')
          .slowConcat('bouh2', function() {
            assert.equal('cou0cou1cou2bouh1bouh2', o.s);
            done();
          });
      });

    });
  });

  it('has an s prop', function() {
    assert.equal(o.s, '');
  });

  it('has the same instance type as an original object', function() {
    var originalO = new Api();
    assert.ok(originalO instanceof Api);
    assert.ok(o instanceof Api);
    assert.ok(o instanceof ChainApi);
    assert.ok(o.constructor === originalO.constructor);
  });

  it('does not modify original prototype', function() {
    assert.ok(Api.prototype !== ChainApi.prototype);
  });

  it('supports individuals calls', function(done) {
    o.concat('he');
    o.concat('llo', function() {
      assert.equal(o.s, 'hello');
      done(null);
    });
  });

  it('supports chained calls', function(done) {
    o
      .concat('ho')
      .concat('la', function() {
        assert.equal(o.s, 'hola');
        done();
      });
  });

  it('supports nested calls', function(done) {
    o
      .concat('sa', function() {
        o
          .concat('l')
      })
      .concat('ut', function() {
        assert.equal(o.s, 'salut');
        done(null);
      })
  })

  it('supports deeply nested calls', function(done) {
    o
      .concat('s', function() {
        o
          .concat('a')
          .concat('l', function() {
            o.concat('u')
            o.concat('t')
            o.concat(' ça ', function() {
              o.concat('va')
            })
          })
      })
      .concat(' ?', function() {
        assert.equal(o.s, 'salut ça va ?');
        done(null);
      })
  })

  it('propagates context to callbacks', function(done) {
    o
      .concat('con', function() {
        this
          .concat('text', function() {
            assert.equal(this.s, 'context');
            done(null);
          });
      })
  })

  it('propagates callback arguments', function(done) {
    o
      .concat('er')
      .concat('ror', function() {
        this.getError('some text error', function(err) {
          assert.equal(err.message, 'some text error');
          done(null);
        })
      })
  })

  it('stops further execution on error', function(done) {
    var val;
    o
      .concat('er')
      .getError('stopped', function(err) {
        val = this.s;
        setTimeout(function() {
          assert.equal(val, "er");
          done();
        }, 60);
      })
      .concat('ror', function(err) {
        val = this.s;
      });
  })

  it('stops immediately further execution on error', function(done) {
    var val;
    o
      .concat('er')
      .getErrorNow('stopped', function(err) {
        val = this.s;
        setTimeout(function() {
          assert.equal(val, "er");
          done();
        }, 60);
      })
      .fastConcat('ror', function(err) {
        val = this.s;
      });
  })

  it('allow reuse of chain after having caught an error', function(done) {
    o
      .concat('er')
      .getError('stopped')
      .concat('a', function(err) {
        assert.equal(err.message, 'stopped');
        this.concat('ror', function() {
          assert.equal(this.s, 'error');
          done();
        });
      })
  })

  it('must catch and propagate immediate error', function(done) {
    o
      .concat('er')
      .getErrorNow('stopped')
      .concat('a', function(err) {
        assert.equal(err.message, 'stopped');
        done();
      })
  })

  it('propagates error to the next callback', function(done) {
    o
      .concat('er')
      .getError('stopped')
      .concat('ror', function(err) {
        assert.equal(err.message, 'stopped');
        done();
      });
  })

  it('should not consider last argument as custom callback if there should have been more arguments', function(done) {
    o.single(function myfun(sign) {
      assert.equal(sign, "myfun1");
      done();
    });
  });

  it('catch errors in action and propagates to the next callback', function(done) {
    var val;
    o
      .concat('er')
      .throwError('stopped', function(err) {
        assert.equal(err.message, 'stopped');
        done();
      })
  })

  it('supports nextTicked calls', function(done) {
    o
      .concat('ne', function() {
        process.nextTick(function() {
          o.concat('xt', function() {
            process.nextTick(function() {
              process.nextTick(function() {
                o.concat('Tick', function() {
                  assert.equal(this.s, 'nextTick');
                  done(null);
                })
              })
            })
          })
        })
      })
  });

  it('supports methods calling methods', function(done) {
    o
      .tripleConcat('one', function() {
        this.tripleConcat('two');
      })
      .tripleConcat('four', function() {
        assert.equal(o.s, 'one1-one2-one3-two1-two2-two3-four1-four2-four3-');
        done();
      });
  });

 it('supports nested and subsequent calls', function(done) {
    o
      .concat('s')
      .call(function() {
        o
          .concat('a', function() {
            o.concat('l')
            .call(function() {
              o.concat('u', function() {
                o.call(function() {
                  o.call(function() {
                    o.concat('t')
                  })
                })
              })
              .concat(' ')
            })
            .concat('ç')
          })
          .concat('a')
      })
      .concat('', function() {
        o
          .call(function() {})
          .concat(' v', function() {
            o.call(function() {
              o.concat('a');
            }).concat(' ?').concat('?', function() {
              assert.equal(o.s, 'salut ça va ??');
              done();
            })
        })
      })
  });


  it('support crazy own chains', function(done) {
    o.multiConcat('multi', function() {
      assert.equal(o.s, 'a-b-c-d-e-f-g-h-i-j-k-l-m-n-o-p-q-')
      done();
    })
  })

  it('supports outside nextTick', function(done) {
    o.concat('one');
    process.nextTick(function() {
      o.concat('two').concat('three', function() {
        assert.equal(this.s, 'onetwothree')
        done();
      })
    })
  })

  it('supports functions', function(done) {
    o.concat('one', named);

    function named() {
      o
        .tripleConcat('two')
        .tripleConcat('three', function() {
          assert.equal(this.s, 'onetwo1-two2-two3-three1-three2-three3-')
          done();
        })
    }
  })

  it('handles multiple objects', function(done) {
    var o2 = new ChainApi();
    var o3 = new ChainApi();

    o.tripleConcat('one');
    o2.tripleConcat('two');
    o3.tripleConcat('three');
    o
      .concat('-and-', function() {
       o2.concat('-or-')
      })
      .tripleConcat('four')
    o3.concat('bon', function() {
      assert.equal(o.s, 'one1-one2-one3--and-four1-four2-four3-');
      assert.equal(o2.s, 'two1-two2-two3--or-');
      assert.equal(this.s, 'three1-three2-three3-bon');
      done(null)
    })
  });

  it('supports methods redifinitions at the prototype level', function(done) {
    var o2 = new ChainApi();

    var original = Api.prototype.concat;

    chainit.add(ChainApi, 'concat', function concat(sub, cb) {
      this.s = this.s.concat(sub + '#');
      setTimeout(cb, ChainApi.getRandomArbitrary(5, 20));
    });

    o2.concat('re');

    o.concat('re');
    o.concat('de', function() {
      o.tripleConcat('fi')
    })
    .concat('nition', function() {
      assert.equal(this.s, 're#de#fi1-#fi2-#fi3-#nition#');
      chainit.add(ChainApi, 'concat', original);
      o.concat('BOUH-', function() {
        chainit.add(ChainApi, 'concat', function concat(sub, cb) {
          this.s = this.s.concat(sub + '!!');
          setTimeout(cb, ChainApi.getRandomArbitrary(5, 20));
        });
        o.concat('hello', function() {
          chainit.add(ChainApi, 'concat', Api.prototype.concat);
          o.concat('-ah', function() {
            o2.concat('def', function() {
              assert.equal(this.s, 're#def');
              assert.equal(o.s, 're#de#fi1-#fi2-#fi3-#nition#BOUH-hello!!-ah');
              done();
            })
          })
        })
      });
    });
  });

  it('supports methods redifinitions at the instance level', function(done) {
    var o2 = new ChainApi();
    var original = o.concat;

    chainit.add(o, 'concat', function concat(sub, cb) {
      this.s += sub + '#'
      setTimeout(cb, ChainApi.getRandomArbitrary(5, 20));
    });

    o
      .concat('one')
      .concat('two', function() {
        this.concat('three');
      })
      .tripleConcat('four');

    o2.concat('hey').concat('ho', function() {
      chainit.add(o, 'concat',original);
      o.concat('YO!', function() {
        assert.equal(this.s, 'one#two#three#four1-#four2-#four3-#YO!');
        assert.equal(o2.s, 'heyho');
        done();
      })
    });
  });

  it('supports constructor arguments', function(done) {
    var o2 = new ChainApi('allo');
    o2.concat(' maman', function() {
      assert.equal(this.s, 'allo maman');
      done();
    })
  });

  it('supports adding new methods', function(done) {
    function newMethod(sub, cb) {
      this.s += sub + 'NEW!-'
      setTimeout(cb, ChainApi.getRandomArbitrary(5, 20));
    }

    assert.equal(typeof o.newMethod, 'undefined');
    chainit.add(o, 'newMethod', newMethod);
    assert.equal(typeof o.newMethod, 'function');

    o
      .newMethod('thiis')
      .newMethod('amazing', function() {
        this.concat('allo', function() {
          assert.equal(this.s, 'thiisNEW!-amazingNEW!-allo');
          done()
        })
      })
  });

  it("propagates a chainState object across queued and immediate methods", function(done) {
    chainit.add(o, 'step1', function(sub, cb) {
      this.s = 'step1-' + sub;
      setImmediate(cb);
    }, function(sub) {
      assert.equal(typeof sub, "string");
      this.chainState = { one: true };
    });
    chainit.add(o, 'step2', function(sub, cb) {
      this.s += '-step2-' + sub;
      setImmediate(cb);
    }, function(sub) {
      assert.equal(typeof sub, "string");
      if (!this.chainState || !this.chainState.one) throw new Error("step2 must be called after step1");
      this.chainState.one = false;
    });
        // this works
    o.step1("test1").step2("test2", function(err) {
      assert.equal(this.s, "step1-test1-step2-test2");
      var err;
      try {
        o.step2('fail', function(err) {
          assert.equal(true, false);
        });
      } catch(e) {
        err = e;
      }
      assert.equal(!!err, true);
      o.step1("test3").step2("test4", function(err) {
        assert.equal(!!err, false);
        done();
      });
    });
  });

  describe('inherited APIS', function() {
    var ChainedInheritedApi;

    beforeEach(function() {
      function InheritedApi() {
        Api.call(this);
      }

      require('util').inherits(InheritedApi, Api);

      ChainedInheritedApi = chainit(InheritedApi);
    });

    it('supports inherited APIS', function(done) {
      var o = new ChainedInheritedApi();
      o
        .concat('1')
        .concat('2')
        .call(function() {
          assert.equal(this.s, '12');
          done();
        })
    });


  });

  describe('should be able to chain', function() {

    describe('static', function() {

      it('anonymous function expressions', function() {
        var Class = function() {};
        var executed = false;

        Class.method = function() {
          executed = true;
        };

        var NewClass = chainit(Class);
        var o = new NewClass();

        // should exist
        assert.ok(NewClass.method);
        NewClass.method();
        assert.ok(executed);

        // should not exists because method is static
        assert.strictEqual(typeof o.method,'undefined');
      });

      it('named function expressions', function() {
        var Class = function() {};
        var executed = false;

        Class.method = function method() {
          executed = true;
        };

        var NewClass = chainit(Class);
        var o = new NewClass();

        // should exist
        assert.ok(NewClass.method);
        NewClass.method();
        assert.ok(executed);

        // should not exists because method is static
        assert.strictEqual(typeof o.method,'undefined');
      });

    });

    describe('prototypical', function() {

      it('anonymous function expressions', function(done) {
        var Class = function() {};
        var executed = false;

        Class.prototype.method = function(obsolete,cb) {
          executed = true;
          cb();
        };

        var NewClass = chainit(Class);
        var o = new NewClass();

        // should not exist because method is a prototype function
        assert.strictEqual(typeof NewClass.method, 'undefined');

        // should exists
        assert.ok(o.method);
        o.method('obsolete', function() {
          assert.ok(executed);
          done();
        });

      });

      it('named function expressions', function(done) {
        var Class = function() {};
        var executed = false;

        Class.prototype.method = function method(obsolete,cb) {
          executed = true;
          cb();
        };

        var NewClass = chainit(Class);
        var o = new NewClass();

        // should not exist because method is a prototype function
        assert.strictEqual(typeof NewClass.method, 'undefined');

        // should exists
        assert.ok(o.method);
        o.method('obsolete', function() {
          assert.ok(executed);
          done();
        });

      });
    });

  });

});
