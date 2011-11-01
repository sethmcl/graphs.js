var Graph = function(config) {
  var config        =   config || {};
	var container     =   config.container || document.body;
  var xLabelColor   =   config.xLabelColor || config.labelColor || '#000';
  var yLabelColor   =   config.yLabelColor || config.labelColor || '#000';
  var yLabelCount   =   config.yLabelCount || 4;
  var canvas;     
  var ctx;   
  var snapFreq      =   100;     
  var graphWidth;
  var graphHeight;
  var graphPadding  = { left: 40, right: 40, top: 10, bottom: 20 };
  var graphBgColor  =   '#dddeee';
  var series        = [];
  var categories    = [];
  var datapoints    = {};  
  var maxValue      = 0;
  var minValue      = 0;
  
  initialize();
  
  /**
  * Initialize graph
  */
  function initialize() {
    canvas  = document.createElement('canvas');
    ctx     = canvas.getContext('2d');

    container.appendChild(canvas);
    snapToContainerDimensions();
    draw();
  }  

  /**
  * Draw the graph
  */
  function draw() {
    ctx.save();
    ctx.clearRect(0, 0, graphWidth, graphHeight);

    var categoryCoords = {};
    var categoryXSpace = (graphWidth - graphPadding.left - graphPadding.right) / (categories.length - 1);
    var value;
    var x;
    var y;
    var categoriesDrawn = false; 
    var yLabelDelta;   
    var yLabel;
    
    ctx.textAlign = 'center';  
          
    // Draw data points
    series.forEach(function(serie, idx) {
      var seriesName = serie.name;
      var seriesColor = serie.color;
      var textWidth;

      ctx.strokeStyle = seriesColor;
      ctx.fillStyle = seriesColor;
      ctx.beginPath();

      categories.forEach(function(categoryName, idx) {

        // Draw data
        value = datapoints[getDpKey(seriesName, categoryName)];

        x = graphPadding.left + categoryXSpace * idx;
        y = graphHeight - graphPadding.bottom - ((value / maxValue) * (graphHeight - graphPadding.top - graphPadding.bottom));        
        
        // Draw data point square
        ctx.fillStyle = seriesColor;
        ctx.fillRect(x - 3, y - 3, 6, 6);

        (idx === 0) ? ctx.moveTo(x, y) : ctx.lineTo(x, y);     
        
        // Draw X labels
        if(!categoriesDrawn) {         
          textWidth = ctx.measureText(categoryName).width;                   
          ctx.fillStyle = xLabelColor;
          ctx.fillText(categoryName, x, graphHeight - 5);          
        }  
      });  
      
      categoriesDrawn = true;
      ctx.stroke();
      ctx.closePath();
      
    });  

    // Draw Y labels
    ctx.save();
    ctx.fillStyle = xLabelColor;
    ctx.strokeStyle = xLabelColor;
    ctx.textBaseline = 'middle';
    yLabelDelta = (maxValue - minValue) / (yLabelCount);

    x = 10;

    for(var i = 0, len = yLabelCount; i <= yLabelCount; i++) {
      y = graphHeight - graphPadding.bottom - ((minValue + i * yLabelDelta / maxValue) * (graphHeight - graphPadding.top - graphPadding.bottom));        

      // Draw line
      ctx.globalAlpha = .1;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(graphWidth, y);
      ctx.stroke();
      ctx.closePath();

      yLabel = (minValue + i * yLabelDelta);
      yLabel = Math.round(yLabel);

      // Draw label
      ctx.globalAlpha = 1;
      ctx.fillText(yLabel, x, y);
    }
    ctx.restore();



    ctx.restore();    
  }

  /**
  * Snap size of graph to match container
  */
  function snapToContainerDimensions() {
    var style   = getComputedStyle(container, null);
    var width   = parseFloat(style.getPropertyValue('width'));
    var height  = parseFloat(style.getPropertyValue('height'));
    var redraw  = false;

    if(width !== graphWidth) {
      graphWidth = canvas.width = width;
      redraw = true;
    }

    if(height !== graphHeight) {
      graphHeight = canvas.height = height;
      redraw = true;
    }

    if(redraw) draw();    
    setTimeout(snapToContainerDimensions, snapFreq); 
  }

  /**
  * Add a new series
  */
  function addSeries(config) {    
    var config  = config || {};
    var defaultColor = 'red;'
    var color   = config.color;
    var name    = config.name || 'Untitled Series';

    series.forEach(function(serie, idx) {
      if(serie.name === name) {
        if(!color && serie.color) color = serie.color;
        series.splice(idx, 1);        
      }  
    });    

    if(!color) color = defaultColor;
    series.push({ name: name, color: color });        
  }

  /**
  * Add a new category
  */
  function addCategory(name) {
    var name = name || 'Untitled Category';
    if(categories.indexOf(name) === -1) categories.push(name);
  }

  /**
  * Add a datapoint
  */
  function addDatapoint(dp) {
    if(!dp || !dp.series || typeof dp.value === 'undefined' || !dp.category) return;

    var value = parseFloat(dp.value);
    var dpkey = getDpKey(dp.series, dp.category);

    addSeries({ name: dp.series });
    addCategory(dp.category);

    if(typeof datapoints[dpkey] === 'undefined') {
      datapoints[dpkey] = value;
    } else {
      datapoints[dpkey] += value;
    }

    maxValue = Math.max(maxValue, datapoints[dpkey]);
  }

  /**
  * Get DP key
  */
  function getDpKey(series, category) {
    return series + '-' + category;
  }

  /**
  * Redraw wrapper
  */
  function ensureRedraw(fn) {
    return function() {
      fn.apply(this, arguments);
      draw();
    }
  }

  // Public API
  this.addDatapoint = ensureRedraw(addDatapoint);
  this.defSeries    = ensureRedraw(addSeries);
}