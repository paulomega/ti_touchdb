Ti.include('test_utils.js')

var _ = require('underscore'),
    touchdb = require('com.obscure.titouchdb');

exports.run_tests = function() {
  var mgr = touchdb.databaseManager;
  var db_source = mgr.createDatabaseNamed('test016_source');
  var db_target = mgr.createDatabaseNamed('test016_target');
  
  var pullTotal = 0, pullCompleted = 0;
  var pushTotal = 0, pushCompleted = 0;
  var pullDone = false, pushDone = false, checkCount = 20;
  
  try {
    createDocuments(db_source, 20);

    Ti.API.info("created 20 docs");
    
    // use the database name for the source, not db.internalURL
    var pull = db_target.pullFromURL(db_source.name);
    pull.addEventListener('change', function(e) {
      assert(!pull.error, "replication error: "+JSON.stringify(pull.error));
      pullDone = !!(!pull.running && (pull.completed >= pull.total));
    });
    pull.start();
    
    // just do pull replication for now
    pushDone = true;
  }
  catch (e) {
    db_source.deleteDatabase();
    db_target.deleteDatabase();
    throw e;
  }
  
  Ti.API.info("replication started");
  // TODO maybe launch replication in a timeout and block on the check?
  var interval = setInterval(function() {
    if (pullDone && pushDone) {
      Ti.API.info("replication done!  doc count = "+db_target.getDocumentCount());
      clearInterval(interval);
      db_source.deleteDatabase();
      db_target.deleteDatabase();
    }
    else if (checkCount-- < 0) {
      clearInterval(interval);
      db_source.deleteDatabase();
      db_target.deleteDatabase();
      throw new Error("timed out waiting for replication");
    }
  }, 2000);
}