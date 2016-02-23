var jsdom = require("jsdom").jsdom;
var repository = require('../../src/framework/repository.js');

var GroupView = require('../../src/framework/groupview.js');
var GroupData = require('../../src/framework/groupdata.js');
var ObjView = require('../../src/framework/objview.js');
var ObjData = require('../../src/framework/objdata.js');
var CommonViewTests = require('./helpers/commonviewtests.js');
var CommonGroupViewTests = require('./helpers/commongroupviewtests.js');
var DatasetReader = require('./helpers/datasetreader.js');

describe("GroupView", function() {

  var datasetReader = new DatasetReader();

  var document, window, $;

  beforeEach(function() {

    document = global.document = jsdom("<html><head><style id='wl-obj-css'></style></head><body></body></html>");
    window = global.window = document.defaultView;
    $ = document.querySelector;
  });

  CommonViewTests('simple_groupdata.js', function() {
    return {
      data: datasetReader.readFromFile('simple_groupdata.js')[0],
      ViewType: GroupView
    };
  });

  CommonViewTests('anchor_groupdata.js', function() {
    return {
      data: datasetReader.readFromFile('anchor_groupdata.js')[0],
      ViewType: GroupView
    };
  });

  CommonGroupViewTests('groupdata_with_objdata.js', function() {
    return {
      data: datasetReader.readFromFile('groupdata_with_objdata.js'),
      ViewType: GroupView,
      parentId: 110530
    };
  });

  it("when a view that is attached using the attachView method changes, the _myChildListenerCallback should be called", function() {
    var groupData = new GroupData(datasetReader.readFromFile('simple_groupdata.js')[0]);
    var groupView = new GroupView(groupData);

    expect(groupView._myChildListenerCallback).toBeDefined();
    spyOn(groupView, '_myChildListenerCallback');

    var objData = new ObjData(datasetReader.readFromFile('simple_objdata.js')[0]);
    var objView = new ObjView(objData);

    groupView.attachView(objView);

    objView.data.set('x', 20);

    expect(groupView._myChildListenerCallback.calls.count()).toBe(1);
    expect(groupView._myChildListenerCallback).toHaveBeenCalledWith(objView.data);
  });

  it("when a view with a parent is attached using the attachView method changes, the _myChildListenerCallback should be called", function() {
    var parentData = new GroupData(datasetReader.readFromFile('simple_groupdata.js')[0]);
    parentData.attributes.id = 123456789;
    var parentView = new GroupView(parentData);

    var objData = new ObjData(datasetReader.readFromFile('simple_objdata.js')[0]);
    var objView = new ObjView(objData);

    parentView.attachView(objView);

    var groupData = new GroupData(datasetReader.readFromFile('simple_groupdata.js')[0]);
    var groupView = new GroupView(groupData);

    expect(groupView._myChildListenerCallback).toBeDefined();
    spyOn(groupView, '_myChildListenerCallback');

    groupView.attachView(objView);
    expect(objView.parent).toBe(groupView);

    objView.data.set('x', 20);

    expect(groupView._myChildListenerCallback.calls.count()).toBe(1);
    expect(groupView._myChildListenerCallback).toHaveBeenCalledWith(objView.data);
  });

  it("when a childview it's data changes, the _renderChildPosition should be called", function() {
    repository.clear();
    repository.importJSON(datasetReader.readFromFile('groupdata_with_objdata.js'), 'default');
    data = repository.get(110530, 'default');
    if (data.attributes.children.length > 0) {
      var parentView = new GroupView(data);
      expect(parentView._myChildListenerCallback).toBeDefined();

      var childView = parentView.childInfo[data.attributes.children[0]].view;
      expect(childView.parent).toBe(parentView);

      childView.data.set('x', 20);
      expect(childView.elWrapper.style.left).toBe('20px');
    }
  });

  it("the order of non-layers objects will be kept correct", function() {
    function setHtml(html) {
      document = global.document =
        jsdom(html);
      window = global.window = document.defaultView;
      $ = document.querySelector;
    }
    var version = 'test';
    repository.clear();

    var dataObjects = [{
      "id": '100',
      "type": 'group',
      "children": ['101', '102'],
      "version": version
    }, {
      "id": '101',
      "type": "node",
      "version": version
    }, {
      "id": '102',
      "type": "node",
      "version": version
    }];

    repository.importJSON(dataObjects, version);

    setHtml("<html><head><style id='wl-obj-css'></style></head><body>" +
      "<div id='100' data-wl-id='100' data-wl-type='" + data.attributes.type + "'>" +
      "<div id='element1'></div>" +
      "<div id='101' data-wl-id='101' data-wl-type='text'></div>" +
      "<div id='element2'></div>" +
      "<div id='102' data-wl-id='102' data-wl-type='text'></div>" +
      "<div id='element3'></div>" +
      "</div></body></html>");

    var parentData = repository.get(100, version);
    var parentElement = document.getElementById('100');
    var parentView = new GroupView(parentData, {
      el: parentElement
    });

    expect(parentElement.children[0].id).toBe('element1');
    expect(parentElement.children[1].id).toBe('101');
    expect(parentElement.children[2].id).toBe('element2');
    expect(parentElement.children[3].id).toBe('102');
    expect(parentElement.children[4].id).toBe('element3');

    parentData.set('children', ['102', '101']);

    expect(parentElement.children[0].id).toBe('element1');
    expect(parentElement.children[1].id).toBe('102');
    expect(parentElement.children[2].id).toBe('element2');
    expect(parentElement.children[3].id).toBe('101');
    expect(parentElement.children[4].id).toBe('element3');
  });
});