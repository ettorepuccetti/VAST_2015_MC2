function EgoNetwork() {
            
    var width = 1000;
    var height = 1000;
    var force
    var svg

    var nodes
    var links
    
    var marker
    var circle
    var path
    var node

    var observedNodes = []

    var center
    var toogledNode

    var linkStrokeScale = d3.scale.linear()
        .range([0,10]);

    var nodeRadiusScale = d3.scale.sqrt()
        .range([5,15]);

    var color = d3.scale.ordinal()
        .range(colorbrewer['Paired'][12]);

    function me(selection){

        if(force) {
            resetForce()
        }
     
        nodes = d3.values(selection.datum().nodes)
        links = selection.datum().links

        linkStrokeScale.domain([0,d3.max(links, function(d) {return d.value})]);
        var groupList = [...new Set(nodes.map(function(d) {return d.group}))]
        color.domain(groupList);
        nodeRadiusScale.domain([0,d3.max(nodes, function(d)  {return d.neighbors.length})])

        if(links.length > 0) {
            document.getElementById("max").innerHTML = "max weighted edge:  "+ d3.max(links, function(d) { return +d.value; }).toString()
            document.getElementById("comm").innerHTML = "n of communities:  "+ groupList.length.toString()
        } else {
            document.getElementById("max").innerHTML = "max count: 0 "
            document.getElementById("comm").innerHTML = "n of communities: 0"
        }

    
        force = d3.layout.force()
            .nodes(nodes)
            .links(links)
            .size([width, height])
            .gravity(0.3)
            .linkDistance(width/3)
            .charge(-1500)
            .on("tick", tick);

        force.start();

        if (!svg) {
            svg = selection.append("svg")
                .attr("width",width)
                .attr("height",height)
        }


        // build the arrow.
       svg.append("svg:defs").selectAll("marker")
            .data(["end"])      // Different link/path types can be defined here
        .enter().append("svg:marker")    // This section adds in the arrows
            .attr("id", String)
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 15)
            .attr("refY", -1.5)
            .attr("markerWidth", 10)
            .attr("markerHeight", 10)
            .attr("orient", "auto")
            .attr("markerUnits", "userSpaceOnUse")
        .append("svg:path")
            .attr("d", "M0,-5L10,0L0,5");

        svg.append("svg:defs").selectAll("marker")
            .data(["end_g"])      // Different link/path types can be defined here
        .enter().append("svg:marker")    // This section adds in the arrows
            .attr("id", String)
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 25)
            .attr("refY", -1.5)
            .attr("markerWidth", 10)
            .attr("markerHeight", 10)
            .attr("orient", "auto")
            .attr("markerUnits", "userSpaceOnUse")
        .append("svg:path")
            .attr("d", "M0,-5L10,0L0,5");

        // add the links and the arrows
        path = svg.append("svg:g").selectAll("path")
            .data(links, function(d) {return d.source.id + "-" + d.target.id;})
        path.enter().append("svg:path")
            .classed("link", true)
            .attr("marker-end", function(d) {if (nodeRadiusScale(d.target.neighbors.length) > 10) return "url(#end_g)"; else return "url(#end)"})
            .attr("stroke", "lightgray")
            .attr("stroke-width", function (d) {return linkStrokeScale(d.value)})
            .attr("fill", "none")
        
        // define the nodes
        node = svg.selectAll(".node")
            .data(nodes,function(d) {return d.id});
        node.enter().append("g")
            .classed("node",true);


        node.call(force.drag);

        // add the nodes
        circle = node.append("circle")
            //.classed("node",true)
            .style("fill", function (d) { return color(d.group)})
            .style("stroke", function(d) { if (d.id === center) return "black"})
            .attr("r", function (d) {return nodeRadiusScale(d.neighbors.length); })
            .on("dblclick", function(d){
                toggleNode(d);
                //force.alpha(0.01).start();
                tick();
            })
            .on("click",function(d) {
                clicked(d);
                tick();
            });

        // add the text 
        node.append("text")
            .attr("x", 12)
            .attr("dy", ".35em")
            .attr("fill", function(d) {if (observedNodes.indexOf(d.id) === -1) return 'red'; else return '#008000'})
            .text(function(d) { return d.id + " (" + d.group.toString() + ")"; });

        function toggleNode(n) {
            toogledNode = n.id
            n.highlight = !n.highlight;
            nodes.forEach(function(node) {
                if(n.neighbors.indexOf(node.id)!==-1)
                    node.highlight = n.highlight;
            })
        }

        function clicked(d) {
            d.clicked = !d.clicked
        }

        // add the curvy lines
        function tick() {
            path.attr("d", function(d) {
                var dx = d.target.x - d.source.x,
                    dy = d.target.y - d.source.y,
                    dr = Math.sqrt(dx * dx + dy * dy);
                return "M" + 
                    d.source.x + "," + 
                    d.source.y + "A" + 
                    dr + "," + dr + " 0 0,1 " + 
                    d.target.x + "," + 
                    d.target.y;
            })
            .classed("highlight", function(l){return l.source.id === toogledNode && l.target.highlight  && l.source.highlight});
            
            node.attr("transform", function(d) { 
                    return "translate(" + d.x + "," + d.y + ")"; })
                .classed("highlight", function(d){return d.highlight})
                .classed("clicked", function(d) {return d.clicked || d.id === 'external'})
        }

        return me
    }


    function resetForce() {
        circle = {};
        node.remove();
        path.remove();
        d3.selectAll('defs').remove();
        nodes = [];
        links = [];
    }

    me.egoCenter = function(_) {
        if(!arguments.length) return center;
		center = _;

        return me;
    }

    me.observedNodes = function(_) {
        if(!arguments.length) return observedNodes;
		observedNodes = _;

        return me;
    }
    me.addObservedNode = function(val) {
        observedNodes.push(val);
        
        return me;
    }

    me.removeObservedNode = function(val) {
        if (observedNodes.indexOf(val) > -1)
            observedNodes.splice(observedNodes.indexOf(val),1)
        else
            console.log("sto cancellando un elemento non presente :/")
    }
    return me
}
