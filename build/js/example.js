/*
 * Camera Buttons
 */

var CameraButtons = function(blueprint3d) 
{
  var orbitControls = blueprint3d.three.controls;
  var three = blueprint3d.three;

  var panSpeed = 30;
  var directions = {
    UP: 1,
    DOWN: 2,
    LEFT: 3,
    RIGHT: 4
  }
  
  function centerView()
  {
	  (function printGraph( obj ) {
		    
		    console.group( ' <%o> ' + obj.name, obj );
		 
		    obj.children.forEach( printGraph );
		    
		    console.groupEnd();

		} ( three.scene.getScene()) );
	  three.centerCamera();
  }

  function init() {
    // Camera controls
    $("#zoom-in").click(zoomIn);
    $("#zoom-out").click(zoomOut);  
    $("#zoom-in").dblclick(preventDefault);
    $("#zoom-out").dblclick(preventDefault);

    $("#reset-view").click(()=>{centerView();});

    $("#move-left").click(function(){
      pan(directions.LEFT)
    })
    $("#move-right").click(function(){
      pan(directions.RIGHT)
    })
    $("#move-up").click(function(){
      pan(directions.UP)
    })
    $("#move-down").click(function(){
      pan(directions.DOWN)
    })

    $("#move-left").dblclick(preventDefault);
    $("#move-right").dblclick(preventDefault);
    $("#move-up").dblclick(preventDefault);
    $("#move-down").dblclick(preventDefault);
  }

  function preventDefault(e) 
  {
    e.preventDefault();
    e.stopPropagation();
  }

  function pan(direction) 
  {
    switch (direction) {
      case directions.UP:
        orbitControls.panXY(0, panSpeed);
        break;
      case directions.DOWN:
        orbitControls.panXY(0, -panSpeed);
        break;
      case directions.LEFT:
        orbitControls.panXY(panSpeed, 0);
        break;
      case directions.RIGHT:
        orbitControls.panXY(-panSpeed, 0);
        break;
    }
  }

  function zoomIn(e) {
    e.preventDefault();
    orbitControls.dollyIn(1.1);
    orbitControls.update();
  }

  function zoomOut(e) {
    e.preventDefault;
    orbitControls.dollyOut(1.1);
    orbitControls.update();
  }

  init();
}

/*
 * Context menu for selected item
 */ 

var ContextMenu = function(blueprint3d) {

  var scope = this;
  var selectedItem;
  var three = blueprint3d.three;

  function init() {
    $("#context-menu-delete").click(function(event) {
        selectedItem.remove();
    });
    
    
//    three.itemSelectedCallbacks.add(itemSelected);
//    three.itemUnselectedCallbacks.add(itemUnselected);
//    
    three.addEventListener(BP3DJS.EVENT_ITEM_SELECTED, function(o){itemSelected(o.item);});
    three.addEventListener(BP3DJS.EVENT_ITEM_UNSELECTED, function(o){itemUnselected();});
    
    initResize();

    $("#fixed").click(function() {
        var checked = $(this).prop('checked');
        selectedItem.setFixed(checked);
        three.itemIsSelected(selectedItem);
    });
  }

  function cmToIn(cm) {
    return cm / 2.54;
  }

  function inToCm(inches) {
    return inches * 2.54;
  }

  function itemSelected(item) {
    selectedItem = item;

    $("#context-menu-name").text(item.metadata.itemName);

    $("#item-width").val(cmToIn(selectedItem.getWidth()).toFixed(0));
    $("#item-height").val(cmToIn(selectedItem.getHeight()).toFixed(0));
    $("#item-depth").val(cmToIn(selectedItem.getDepth()).toFixed(0));

    $("#context-menu").show();

    $("#fixed").prop('checked', item.fixed);
  }

  function resize() {
    selectedItem.resize(
      inToCm($("#item-height").val()),
      inToCm($("#item-width").val()),
      inToCm($("#item-depth").val())
    );
  }

  function initResize() {
    $("#item-height").change(resize);
    $("#item-width").change(resize);
    $("#item-depth").change(resize);
  }

  function itemUnselected() {
    selectedItem = null;
    $("#context-menu").hide();
  }

  init();
}

/*
 * Loading modal for items
 */

var ModalEffects = function(blueprint3d) {

  var scope = this;
  var blueprint3d = blueprint3d;
  var itemsLoading = 0;

  this.setActiveItem = function(active) {
    itemSelected = active;
    update();
  }

  function update() {
    if (itemsLoading > 0) {
      $("#loading-modal").show();
    } else {
      $("#loading-modal").hide();
    }
  }

  function init() 
  {
	
//    blueprint3d.model.scene.itemLoadingCallbacks.add(function() {
   blueprint3d.model.scene.addEventListener(BP3DJS.EVENT_ITEM_LOADING, function() {
      itemsLoading += 1;
      update();
    });

//   blueprint3d.model.scene.itemLoadedCallbacks.add(function() {
	   blueprint3d.model.scene.addEventListener(BP3DJS.EVENT_ITEM_LOADED, function() {
      itemsLoading -= 1;
      update();
    });   

    update();
  }

  init();
}

/*
 * Side menu
 */

var SideMenu = function(blueprint3d, floorplanControls, modalEffects) {
  var blueprint3d = blueprint3d;
  var floorplanControls = floorplanControls;
  var modalEffects = modalEffects;

  var ACTIVE_CLASS = "active";

  var tabs = {
    "FLOORPLAN" : $("#floorplan_tab"),
    "SHOP" : $("#items_tab"),
    "DESIGN" : $("#design_tab")
  }

  var scope = this;
  this.stateChangeCallbacks = $.Callbacks();

  this.states = {
    "DEFAULT" : {
      "div" : $("#viewer"),
      "tab" : tabs.DESIGN
    },
    "FLOORPLAN" : {
      "div" : $("#floorplanner"),
      "tab" : tabs.FLOORPLAN
    },
    "SHOP" : {
      "div" : $("#add-items"),
      "tab" : tabs.SHOP
    }
  }

  // sidebar state
  var currentState = scope.states.FLOORPLAN;

  function init() {
    for (var tab in tabs) {
      var elem = tabs[tab];
      elem.click(tabClicked(elem));
    }

    $("#update-floorplan").click(floorplanUpdate);

    initLeftMenu();

    blueprint3d.three.updateWindowSize();
    handleWindowResize();

    initItems();

    setCurrentState(scope.states.DEFAULT);
  }

  function floorplanUpdate() {
    setCurrentState(scope.states.DEFAULT);
  }

  function tabClicked(tab) {
    return function() {
      // Stop three from spinning
      blueprint3d.three.stopSpin();

      // Selected a new tab
      for (var key in scope.states) {
        var state = scope.states[key];
        if (state.tab == tab) {
          setCurrentState(state);
          break;
        }
      }
    }
  }
  
  function setCurrentState(newState) {

    if (currentState == newState) {
      return;
    }

    // show the right tab as active
    if (currentState.tab !== newState.tab) {
      if (currentState.tab != null) {
        currentState.tab.removeClass(ACTIVE_CLASS);          
      }
      if (newState.tab != null) {
        newState.tab.addClass(ACTIVE_CLASS);
      }
    }

    // set item unselected
    blueprint3d.three.getController().setSelectedObject(null);

    // show and hide the right divs
    currentState.div.hide()
    newState.div.show()

    // custom actions
    if (newState == scope.states.FLOORPLAN) {
      floorplanControls.updateFloorplanView();
      floorplanControls.handleWindowResize();
    } 

    if (currentState == scope.states.FLOORPLAN) {
      blueprint3d.model.floorplan.update();
    }

    if (newState == scope.states.DEFAULT) {
      blueprint3d.three.updateWindowSize();
    }
 
    // set new state
    handleWindowResize();    
    currentState = newState;

    scope.stateChangeCallbacks.fire(newState);
  }

  function initLeftMenu() {
    $( window ).resize( handleWindowResize );
    handleWindowResize();
  }

  function handleWindowResize() {
    $(".sidebar").height(window.innerHeight);
    $("#add-items").height(window.innerHeight);

  };

  // TODO: this doesn't really belong here
  function initItems() {
    $("#add-items").find(".add-item").mousedown(function(e) {
      var modelUrl = $(this).attr("model-url");
      var itemType = parseInt($(this).attr("model-type"));
      var metadata = {
        itemName: $(this).attr("model-name"),
        resizable: true,
        modelUrl: modelUrl,
        itemType: itemType
      }
      console.log(itemType, modelUrl, metadata);
      blueprint3d.model.scene.addItem(itemType, modelUrl, metadata);
      setCurrentState(scope.states.DEFAULT);
    });
  }

  init();

}

/*
 * Change floor and wall textures
 */

var TextureSelector = function (blueprint3d, sideMenu) {

  var scope = this;
  var three = blueprint3d.three;
  var isAdmin = isAdmin;

  var currentTarget = null;

  function initTextureSelectors() 
  {
	 $('#environments :checkbox').change(function()
	 {
		 console.log(this.checked)
		 three.skybox.toggleEnvironment(this.checked);
	 });
    $(".texture-select-thumbnail").click(function(e) 
    {
      var textureUrl = $(this).attr("texture-url");
      var textureStretch = ($(this).attr("texture-stretch") == "true");
      var textureScale = parseInt($(this).attr("texture-scale"));
      var isEnvTexture = (textureUrl.indexOf('envs') > -1);
      
      if(!isEnvTexture)
      {
    	  currentTarget.setTexture(textureUrl, textureStretch, textureScale);
      }
      else
	  {
    	  three.skybox.setEnvironmentMap(textureUrl);
	  }
      
      e.preventDefault();
    });
  }

  function init() {
    // three.wallClicked.add(wallClicked);
    // three.floorClicked.add(floorClicked);
    // three.itemSelectedCallbacks.add(reset);
    // three.nothingClicked.add(reset);

    three.addEventListener(BP3DJS.EVENT_WALL_CLICKED, (o)=>{wallClicked(o.item);});
    three.addEventListener(BP3DJS.EVENT_FLOOR_CLICKED, (o)=>{floorClicked(o.item);});
    three.addEventListener(BP3DJS.EVENT_NOTHING_CLICKED, ()=>{reset();});
    three.addEventListener(BP3DJS.EVENT_ITEM_SELECTED, (o)=>{reset();});    
    sideMenu.stateChangeCallbacks.add(reset);
    initTextureSelectors();
  }

  function wallClicked(halfEdge) {
    currentTarget = halfEdge;
    $("#floorTexturesDiv").hide();  
    $("#wallTextures").show();  
  }

  function floorClicked(room) {
    currentTarget = room;
    $("#wallTextures").hide();  
    $("#floorTexturesDiv").show();  
  }

  function reset() {
    $("#wallTextures").hide();  
    $("#floorTexturesDiv").hide();  
  }

  init();
}

/*
 * Floorplanner controls
 */

var ViewerFloorplanner = function(blueprint3d) {

  var canvasWrapper = '#floorplanner';

  // buttons
  var move = '#move';
  var remove = '#delete';
  var draw = '#draw';

  var activeStlye = 'btn-primary disabled';

  this.floorplanner = blueprint3d.floorplanner;

  var scope = this;

  function init() {

    $( window ).resize( scope.handleWindowResize );
    scope.handleWindowResize();

    // mode buttons
//    scope.floorplanner.modeResetCallbacks.add(function(mode) {
    scope.floorplanner.addEventListener(BP3DJS.EVENT_MODE_RESET, function(mode) {
      $(draw).removeClass(activeStlye);
      $(remove).removeClass(activeStlye);
      $(move).removeClass(activeStlye);
      if (mode == BP3DJS.floorplannerModes.MOVE) {
          $(move).addClass(activeStlye);
      } else if (mode == BP3DJS.floorplannerModes.DRAW) {
          $(draw).addClass(activeStlye);
      } else if (mode == BP3DJS.floorplannerModes.DELETE) {
          $(remove).addClass(activeStlye);
      }

      if (mode == BP3DJS.floorplannerModes.DRAW) {
        $("#draw-walls-hint").show();
        scope.handleWindowResize();
      } else {
        $("#draw-walls-hint").hide();
      }
    });

    $(move).click(function(){
      scope.floorplanner.setMode(BP3DJS.floorplannerModes.MOVE);
    });

    $(draw).click(function(){
      scope.floorplanner.setMode(BP3DJS.floorplannerModes.DRAW);
    });

    $(remove).click(function(){
      scope.floorplanner.setMode(BP3DJS.floorplannerModes.DELETE);
    });
  }

  this.updateFloorplanView = function() {
    scope.floorplanner.reset();
  }

  this.handleWindowResize = function() {
    $(canvasWrapper).height(window.innerHeight - $(canvasWrapper).offset().top);
    scope.floorplanner.resizeView();
  };

  init();
};

var mainControls = function(blueprint3d) {
  var blueprint3d = blueprint3d;

  function newDesign() {
    // blueprint3d.model.loadSerialized('{"floorplan":{"version":"0.0.2a","corners":{"71d4f128-ae80-3d58-9bd2-711c6ce6cdf2":{"x":0,"y":0,"elevation":4},"f90da5e3-9e0e-eba7-173d-eb0b071e838e":{"x":0,"y":5,"elevation":2.5},"da026c08-d76a-a944-8e7b-096b752da9ed":{"x":5,"y":5,"elevation":2.5},"4e3d65cb-54c0-0681-28bf-bddcc7bdb571":{"x":5,"y":0,"elevation":4.01},"d585815c-2797-27d2-3150-21b9889ac57a":{"x":0,"y":-2.529,"elevation":2.5},"e90970f7-bcc3-0da7-52d0-14be0854e94f":{"x":5.01,"y":-2.529,"elevation":2.5}},"walls":[{"corner1":"71d4f128-ae80-3d58-9bd2-711c6ce6cdf2","corner2":"f90da5e3-9e0e-eba7-173d-eb0b071e838e","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"wallType":"STRAIGHT","a":{"x":-176.77669529663686,"y":176.7766952966369},"b":{"x":-176.7766952966369,"y":323.22330470336317}},{"corner1":"f90da5e3-9e0e-eba7-173d-eb0b071e838e","corner2":"da026c08-d76a-a944-8e7b-096b752da9ed","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"wallType":"STRAIGHT","a":{"x":176.7766952966369,"y":676.7766952966368},"b":{"x":323.22330470336317,"y":676.776695296637}},{"corner1":"da026c08-d76a-a944-8e7b-096b752da9ed","corner2":"4e3d65cb-54c0-0681-28bf-bddcc7bdb571","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"wallType":"STRAIGHT","a":{"x":676.7766952966368,"y":323.2233047033631},"b":{"x":676.776695296637,"y":176.77669529663686}},{"corner1":"4e3d65cb-54c0-0681-28bf-bddcc7bdb571","corner2":"71d4f128-ae80-3d58-9bd2-711c6ce6cdf2","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"wallType":"STRAIGHT","a":{"x":323.2233047033631,"y":-176.77669529663686},"b":{"x":176.77669529663686,"y":-176.7766952966369}},{"corner1":"71d4f128-ae80-3d58-9bd2-711c6ce6cdf2","corner2":"d585815c-2797-27d2-3150-21b9889ac57a","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"wallType":"STRAIGHT","a":{"x":89.4207235488508,"y":-89.42072354885082},"b":{"x":89.42072354885082,"y":-163.49927645114923}},{"corner1":"d585815c-2797-27d2-3150-21b9889ac57a","corner2":"e90970f7-bcc3-0da7-52d0-14be0854e94f","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"wallType":"STRAIGHT","a":{"x":177.11327812448164,"y":-75.8067218755184},"b":{"x":323.8387218755183,"y":-75.80672187551838}},{"corner1":"e90970f7-bcc3-0da7-52d0-14be0854e94f","corner2":"4e3d65cb-54c0-0681-28bf-bddcc7bdb571","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"wallType":"STRAIGHT","a":{"x":411.1946936233043,"y":-163.83585927899395},"b":{"x":410.91585927899393,"y":-89.75730637669555}}],"rooms":{"f90da5e3-9e0e-eba7-173d-eb0b071e838e,71d4f128-ae80-3d58-9bd2-711c6ce6cdf2,4e3d65cb-54c0-0681-28bf-bddcc7bdb571,da026c08-d76a-a944-8e7b-096b752da9ed":{"name":"A New Room"},"71d4f128-ae80-3d58-9bd2-711c6ce6cdf2,4e3d65cb-54c0-0681-28bf-bddcc7bdb571,da026c08-d76a-a944-8e7b-096b752da9ed,f90da5e3-9e0e-eba7-173d-eb0b071e838e":{"name":"A New Room"},"71d4f128-ae80-3d58-9bd2-711c6ce6cdf2,d585815c-2797-27d2-3150-21b9889ac57a,e90970f7-bcc3-0da7-52d0-14be0854e94f,4e3d65cb-54c0-0681-28bf-bddcc7bdb571":{"name":"A New Room"}},"wallTextures":[],"floorTextures":{},"newFloorTextures":{},"carbonSheet":{"url":"","transparency":1,"x":0,"y":0,"anchorX":0,"anchorY":0,"width":0.01,"height":0.01}},"items":[{"item_name":"Bathroomcabinet","item_type":2,"format":"gltf","model_url":"models/gltf/bathroomCabinet.glb","xpos":37.999998982995756,"ypos":59.500002324581146,"zpos":429.0546421644188,"rotation":1.5707963267948966,"scale_x":300,"scale_y":300,"scale_z":300,"fixed":false,"material_colors":["#e49964","#ac744c","#bcd1d6"]},{"item_name":"Doorway","item_type":3,"format":"gltf","model_url":"models/gltf/doorway.glb","xpos":0.5000000000000231,"ypos":152.4297604560852,"zpos":97.38005415215696,"rotation":1.5707963267948966,"scale_x":300,"scale_y":300,"scale_z":300,"fixed":false,"material_colors":["#e49964","#bcd1d6"]},{"item_name":"Window","item_type":3,"model_url":"models/js/whitewindow.js","xpos":403.48200825165,"ypos":263.44346989199266,"zpos":0.5,"rotation":-1.812609019796174e-18,"scale_x":1,"scale_y":1,"scale_z":1,"fixed":false,"material_colors":["#ffffff","#a09050","#a09050","#ffffff","#ffffff","#6c6c6c","#000000","#000000","#ffffff","#ffffff","#6c6c6c","#ffffff"]},{"item_name":"Red Chair","item_type":1,"model_url":"models/js/ik-ekero-orange_baked.js","xpos":448.53152221165584,"ypos":37.50235073007,"zpos":36.723693898529206,"rotation":-0.2860982221749813,"scale_x":1,"scale_y":1,"scale_z":1,"fixed":false,"material_colors":["#ffffff"]}]}');
  }

  function loadDesign() 
  {
    files = $("#loadFile").get(0).files;
    var reader  = new FileReader();
    reader.onload = function(event) {
        var data = event.target.result;
        blueprint3d.model.loadSerialized(data);
    }
    reader.readAsText(files[0]);
  }

  function saveDesign() {
    var data = blueprint3d.model.exportSerialized();
    var a = window.document.createElement('a');
    var blob = new Blob([data], {type : 'text'});
    a.href = window.URL.createObjectURL(blob);
    a.download = 'design.blueprint3d';
    document.body.appendChild(a)
    a.click();
    document.body.removeChild(a)
  }

  function init() {
    $("#new").click(newDesign);
    $("#loadFile").change(loadDesign);
    $("#saveFile").click(saveDesign);
  }

  init();
}

/*
 * Initialize!
 */

$(document).ready(function() {

  // main setup
  var opts = 
  {
    floorplannerElement: 'floorplanner-canvas',
    threeElement: '#viewer',
    threeCanvasElement: 'three-canvas',
    textureDir: "models/textures/",
    widget: false
  }
  var blueprint3d = new BP3DJS.BlueprintJS(opts);

  var modalEffects = new ModalEffects(blueprint3d);
  var viewerFloorplanner = new ViewerFloorplanner(blueprint3d);
  var contextMenu = new ContextMenu(blueprint3d);
  var sideMenu = new SideMenu(blueprint3d, viewerFloorplanner, modalEffects);
  var textureSelector = new TextureSelector(blueprint3d, sideMenu);        
  var cameraButtons = new CameraButtons(blueprint3d);
  mainControls(blueprint3d);
  
  // var myhome = '{"floorplan":{"version":"0.0.2a","corners":{"71d4f128-ae80-3d58-9bd2-711c6ce6cdf2":{"x":0,"y":0,"elevation":4},"f90da5e3-9e0e-eba7-173d-eb0b071e838e":{"x":0,"y":5,"elevation":2.5},"da026c08-d76a-a944-8e7b-096b752da9ed":{"x":5,"y":5,"elevation":2.5},"4e3d65cb-54c0-0681-28bf-bddcc7bdb571":{"x":5,"y":0,"elevation":4.01},"d585815c-2797-27d2-3150-21b9889ac57a":{"x":0,"y":-2.529,"elevation":2.5},"e90970f7-bcc3-0da7-52d0-14be0854e94f":{"x":5.01,"y":-2.529,"elevation":2.5}},"walls":[{"corner1":"71d4f128-ae80-3d58-9bd2-711c6ce6cdf2","corner2":"f90da5e3-9e0e-eba7-173d-eb0b071e838e","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"wallType":"STRAIGHT","a":{"x":-176.77669529663686,"y":176.7766952966369},"b":{"x":-176.7766952966369,"y":323.22330470336317}},{"corner1":"f90da5e3-9e0e-eba7-173d-eb0b071e838e","corner2":"da026c08-d76a-a944-8e7b-096b752da9ed","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"wallType":"STRAIGHT","a":{"x":176.7766952966369,"y":676.7766952966368},"b":{"x":323.22330470336317,"y":676.776695296637}},{"corner1":"da026c08-d76a-a944-8e7b-096b752da9ed","corner2":"4e3d65cb-54c0-0681-28bf-bddcc7bdb571","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"wallType":"STRAIGHT","a":{"x":676.7766952966368,"y":323.2233047033631},"b":{"x":676.776695296637,"y":176.77669529663686}},{"corner1":"4e3d65cb-54c0-0681-28bf-bddcc7bdb571","corner2":"71d4f128-ae80-3d58-9bd2-711c6ce6cdf2","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"wallType":"STRAIGHT","a":{"x":323.2233047033631,"y":-176.77669529663686},"b":{"x":176.77669529663686,"y":-176.7766952966369}},{"corner1":"71d4f128-ae80-3d58-9bd2-711c6ce6cdf2","corner2":"d585815c-2797-27d2-3150-21b9889ac57a","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"wallType":"STRAIGHT","a":{"x":89.4207235488508,"y":-89.42072354885082},"b":{"x":89.42072354885082,"y":-163.49927645114923}},{"corner1":"d585815c-2797-27d2-3150-21b9889ac57a","corner2":"e90970f7-bcc3-0da7-52d0-14be0854e94f","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"wallType":"STRAIGHT","a":{"x":177.11327812448164,"y":-75.8067218755184},"b":{"x":323.8387218755183,"y":-75.80672187551838}},{"corner1":"e90970f7-bcc3-0da7-52d0-14be0854e94f","corner2":"4e3d65cb-54c0-0681-28bf-bddcc7bdb571","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"wallType":"STRAIGHT","a":{"x":411.1946936233043,"y":-163.83585927899395},"b":{"x":410.91585927899393,"y":-89.75730637669555}}],"rooms":{"f90da5e3-9e0e-eba7-173d-eb0b071e838e,71d4f128-ae80-3d58-9bd2-711c6ce6cdf2,4e3d65cb-54c0-0681-28bf-bddcc7bdb571,da026c08-d76a-a944-8e7b-096b752da9ed":{"name":"A New Room"},"71d4f128-ae80-3d58-9bd2-711c6ce6cdf2,4e3d65cb-54c0-0681-28bf-bddcc7bdb571,da026c08-d76a-a944-8e7b-096b752da9ed,f90da5e3-9e0e-eba7-173d-eb0b071e838e":{"name":"A New Room"},"71d4f128-ae80-3d58-9bd2-711c6ce6cdf2,d585815c-2797-27d2-3150-21b9889ac57a,e90970f7-bcc3-0da7-52d0-14be0854e94f,4e3d65cb-54c0-0681-28bf-bddcc7bdb571":{"name":"A New Room"}},"wallTextures":[],"floorTextures":{},"newFloorTextures":{},"carbonSheet":{"url":"","transparency":1,"x":0,"y":0,"anchorX":0,"anchorY":0,"width":0.01,"height":0.01}},"items":[{"item_name":"Bathroomcabinet","item_type":2,"format":"gltf","model_url":"models/gltf/bathroomCabinet.glb","xpos":37.999998982995756,"ypos":59.500002324581146,"zpos":429.0546421644188,"rotation":1.5707963267948966,"scale_x":300,"scale_y":300,"scale_z":300,"fixed":false,"material_colors":["#e49964","#ac744c","#bcd1d6"]},{"item_name":"Doorway","item_type":3,"format":"gltf","model_url":"models/gltf/doorway.glb","xpos":0.5000000000000231,"ypos":152.4297604560852,"zpos":97.38005415215696,"rotation":1.5707963267948966,"scale_x":300,"scale_y":300,"scale_z":300,"fixed":false,"material_colors":["#e49964","#bcd1d6"]},{"item_name":"Window","item_type":3,"model_url":"models/js/whitewindow.js","xpos":403.48200825165,"ypos":263.44346989199266,"zpos":0.5,"rotation":-1.812609019796174e-18,"scale_x":1,"scale_y":1,"scale_z":1,"fixed":false,"material_colors":["#ffffff","#a09050","#a09050","#ffffff","#ffffff","#6c6c6c","#000000","#000000","#ffffff","#ffffff","#6c6c6c","#ffffff"]},{"item_name":"Red Chair","item_type":1,"model_url":"models/js/ik-ekero-orange_baked.js","xpos":448.53152221165584,"ypos":37.50235073007,"zpos":36.723693898529206,"rotation":-0.2860982221749813,"scale_x":1,"scale_y":1,"scale_z":1,"fixed":false,"material_colors":["#ffffff"]}]}';
  // This serialization format needs work
  // Load a simple rectangle room
//  blueprint3d.model.loadSerialized('{"floorplan":{"corners":{"f90da5e3-9e0e-eba7-173d-eb0b071e838e":{"x":204.85099999999989,"y":289.052},"da026c08-d76a-a944-8e7b-096b752da9ed":{"x":672.2109999999999,"y":289.052},"4e3d65cb-54c0-0681-28bf-bddcc7bdb571":{"x":672.2109999999999,"y":-178.308},"71d4f128-ae80-3d58-9bd2-711c6ce6cdf2":{"x":204.85099999999989,"y":-178.308}},"walls":[{"corner1":"71d4f128-ae80-3d58-9bd2-711c6ce6cdf2","corner2":"f90da5e3-9e0e-eba7-173d-eb0b071e838e","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0}},{"corner1":"f90da5e3-9e0e-eba7-173d-eb0b071e838e","corner2":"da026c08-d76a-a944-8e7b-096b752da9ed","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0}},{"corner1":"da026c08-d76a-a944-8e7b-096b752da9ed","corner2":"4e3d65cb-54c0-0681-28bf-bddcc7bdb571","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0}},{"corner1":"4e3d65cb-54c0-0681-28bf-bddcc7bdb571","corner2":"71d4f128-ae80-3d58-9bd2-711c6ce6cdf2","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0}}],"wallTextures":[],"floorTextures":{},"newFloorTextures":{}},"items":[]}');
  // blueprint3d.model.loadSerialized(myhome);
});
