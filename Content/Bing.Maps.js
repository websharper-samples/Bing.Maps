// $begin{copyright}
//
// This file is part of WebSharper
//
// Copyright (c) 2008-2016 IntelliFactory
//
// Licensed under the Apache License, Version 2.0 (the "License"); you
// may not use this file except in compliance with the License.  You may
// obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
// implied.  See the License for the specific language governing
// permissions and limitations under the License.
//
// $end{copyright}

IntelliFactory = {
    Runtime: {
        Ctor: function (ctor, typeFunction) {
            ctor.prototype = typeFunction.prototype;
            return ctor;
        },

        Class: function (members, base, statics) {
            var proto = members;
            if (base) {
                proto = new base();
                for (var m in members) { proto[m] = members[m] }
            }
            var typeFunction = function (copyFrom) {
                if (copyFrom) {
                    for (var f in copyFrom) { this[f] = copyFrom[f] }
                }
            }
            typeFunction.prototype = proto;
            if (statics) {
                for (var f in statics) { typeFunction[f] = statics[f] }
            }
            return typeFunction;
        },

        Clone: function (obj) {
            var res = {};
            for (var p in obj) { res[p] = obj[p] }
            return res;
        },

        NewObject:
            function (kv) {
                var o = {};
                for (var i = 0; i < kv.length; i++) {
                    o[kv[i][0]] = kv[i][1];
                }
                return o;
            },

        DeleteEmptyFields:
            function (obj, fields) {
                for (var i = 0; i < fields.length; i++) {
                    var f = fields[i];
                    if (obj[f] === void (0)) { delete obj[f]; }
                }
                return obj;
            },

        GetOptional:
            function (value) {
                return (value === void (0)) ? null : { $: 1, $0: value };
            },

        SetOptional:
            function (obj, field, value) {
                if (value) {
                    obj[field] = value.$0;
                } else {
                    delete obj[field];
                }
            },

        SetOrDelete:
            function (obj, field, value) {
                if (value === void (0)) {
                    delete obj[field];
                } else {
                    obj[field] = value;
                }
            },

        Apply: function (f, obj, args) {
            return f.apply(obj, args);
        },

        Bind: function (f, obj) {
            return function () { return f.apply(this, arguments) };
        },

        CreateFuncWithArgs: function (f) {
            return function () { return f(Array.prototype.slice.call(arguments)) };
        },

        CreateFuncWithOnlyThis: function (f) {
            return function () { return f(this) };
        },

        CreateFuncWithThis: function (f) {
            return function () { return f(this).apply(null, arguments) };
        },

        CreateFuncWithThisArgs: function (f) {
            return function () { return f(this)(Array.prototype.slice.call(arguments)) };
        },

        CreateFuncWithRest: function (length, f) {
            return function () { return f(Array.prototype.slice.call(arguments, 0, length).concat([Array.prototype.slice.call(arguments, length)])) };
        },

        CreateFuncWithArgsRest: function (length, f) {
            return function () { return f([Array.prototype.slice.call(arguments, 0, length), Array.prototype.slice.call(arguments, length)]) };
        },

        BindDelegate: function (func, obj) {
            var res = func.bind(obj);
            res.$Func = func;
            res.$Target = obj;
            return res;
        },

        CreateDelegate: function (invokes) {
            if (invokes.length == 0) return null;
            if (invokes.length == 1) return invokes[0];
            var del = function () {
                var res;
                for (var i = 0; i < invokes.length; i++) {
                    res = invokes[i].apply(null, arguments);
                }
                return res;
            };
            del.$Invokes = invokes;
            return del;
        },

        CombineDelegates: function (dels) {
            var invokes = [];
            for (var i = 0; i < dels.length; i++) {
                var del = dels[i];
                if (del) {
                    if ("$Invokes" in del)
                        invokes = invokes.concat(del.$Invokes);
                    else
                        invokes.push(del);
                }
            }
            return IntelliFactory.Runtime.CreateDelegate(invokes);
        },

        DelegateEqual: function (d1, d2) {
            if (d1 === d2) return true;
            if (d1 == null || d2 == null) return false;
            var i1 = d1.$Invokes || [d1];
            var i2 = d2.$Invokes || [d2];
            if (i1.length != i2.length) return false;
            for (var i = 0; i < i1.length; i++) {
                var e1 = i1[i];
                var e2 = i2[i];
                if (!(e1 === e2 || ("$Func" in e1 && "$Func" in e2 && e1.$Func === e2.$Func && e1.$Target == e2.$Target)))
                    return false;
            }
            return true;
        },

        ThisFunc: function (d) {
            return function () {
                var args = Array.prototype.slice.call(arguments);
                args.unshift(this);
                return d.apply(null, args);
            };
        },

        ThisFuncOut: function (f) {
            return function () {
                var args = Array.prototype.slice.call(arguments);
                return f.apply(args.shift(), args);
            };
        },

        ParamsFunc: function (length, d) {
            return function () {
                var args = Array.prototype.slice.call(arguments);
                return d.apply(null, args.slice(0, length).concat([args.slice(length)]));
            };
        },

        ParamsFuncOut: function (length, f) {
            return function () {
                var args = Array.prototype.slice.call(arguments);
                return f.apply(null, args.slice(0, length).concat(args[length]));
            };
        },

        ThisParamsFunc: function (length, d) {
            return function () {
                var args = Array.prototype.slice.call(arguments);
                args.unshift(this);
                return d.apply(null, args.slice(0, length + 1).concat([args.slice(length + 1)]));
            };
        },

        ThisParamsFuncOut: function (length, f) {
            return function () {
                var args = Array.prototype.slice.call(arguments);
                return f.apply(args.shift(), args.slice(0, length).concat(args[length]));
            };
        },

        Curried: function (f, n, args) {
            args = args || [];
            return function (a) {
                var allArgs = args.concat([a === void (0) ? null : a]);
                if (n == 1)
                    return f.apply(null, allArgs);
                if (n == 2)
                    return function (a) { return f.apply(null, allArgs.concat([a === void (0) ? null : a])); }
                return IntelliFactory.Runtime.Curried(f, n - 1, allArgs);
            }
        },

        Curried2: function (f) {
            return function (a) { return function (b) { return f(a, b); } }
        },

        Curried3: function (f) {
            return function (a) { return function (b) { return function (c) { return f(a, b, c); } } }
        },

        UnionByType: function (types, value, optional) {
            var vt = typeof value;
            for (var i = 0; i < types.length; i++) {
                var t = types[i];
                if (typeof t == "number") {
                    if (Array.isArray(value) && (t == 0 || value.length == t)) {
                        return { $: i, $0: value };
                    }
                } else {
                    if (t == vt) {
                        return { $: i, $0: value };
                    }
                }
            }
            if (!optional) {
                throw new Error("Type not expected for creating Choice value.");
            }
        },

        ScriptBasePath: "./",

        ScriptPath: function (a, f) {
            return this.ScriptBasePath + (this.ScriptSkipAssemblyDir ? "" : a + "/") + f;
        },

        OnLoad:
            function (f) {
                if (!("load" in this)) {
                    this.load = [];
                }
                this.load.push(f);
            },

        Start:
            function () {
                function run(c) {
                    for (var i = 0; i < c.length; i++) {
                        c[i]();
                    }
                }
                if ("load" in this) {
                    run(this.load);
                    this.load = [];
                }
            },
    }
}

IntelliFactory.Runtime.OnLoad(function () {
    if (self.WebSharper && WebSharper.Activator && WebSharper.Activator.Activate)
        WebSharper.Activator.Activate()
});

// Polyfill

if (!Date.now) {
    Date.now = function () {
        return new Date().getTime();
    };
}

if (!Math.trunc) {
    Math.trunc = function (x) {
        return x < 0 ? Math.ceil(x) : Math.floor(x);
    }
}

if (!Object.setPrototypeOf) {
  Object.setPrototypeOf = function (obj, proto) {
    obj.__proto__ = proto;
    return obj;
  }
}

function ignore() { };
function id(x) { return x };
function fst(x) { return x[0] };
function snd(x) { return x[1] };
function trd(x) { return x[2] };

if (!console) {
    console = {
        count: ignore,
        dir: ignore,
        error: ignore,
        group: ignore,
        groupEnd: ignore,
        info: ignore,
        log: ignore,
        profile: ignore,
        profileEnd: ignore,
        time: ignore,
        timeEnd: ignore,
        trace: ignore,
        warn: ignore
    }
};
(function()
{
 "use strict";
 var Global,WebSharper,Bing,Tests,Main,Obj,Html,Client,Pagelet,Tags,Operators,EventTarget,Node,TagBuilder,Arrays,AttributeBuilder,Attr,EventsPervasives,Maps,Rest,Element,List,T,WindowOrWorkerGlobalScope,SC$1,Text,Operators$1,MapsLoading,SC$2,JavaScript,Pervasives,Strings,Implementation,JQueryHtmlProvider,DeprecatedTagBuilder,Collections,List$1,Attribute,SC$3,SC$4,Unchecked,Seq,Enumerator,Object,ListEnumerator,Events,JQueryEventSupport,T$1,IntelliFactory,Runtime;
 Global=self;
 WebSharper=Global.WebSharper=Global.WebSharper||{};
 Bing=WebSharper.Bing=WebSharper.Bing||{};
 Tests=Bing.Tests=Bing.Tests||{};
 Main=Tests.Main=Tests.Main||{};
 Obj=WebSharper.Obj=WebSharper.Obj||{};
 Html=WebSharper.Html=WebSharper.Html||{};
 Client=Html.Client=Html.Client||{};
 Pagelet=Client.Pagelet=Client.Pagelet||{};
 Tags=Client.Tags=Client.Tags||{};
 Operators=WebSharper.Operators=WebSharper.Operators||{};
 EventTarget=Global.EventTarget;
 Node=Global.Node;
 TagBuilder=Client.TagBuilder=Client.TagBuilder||{};
 Arrays=WebSharper.Arrays=WebSharper.Arrays||{};
 AttributeBuilder=Client.AttributeBuilder=Client.AttributeBuilder||{};
 Attr=Client.Attr=Client.Attr||{};
 EventsPervasives=Client.EventsPervasives=Client.EventsPervasives||{};
 Maps=Bing.Maps=Bing.Maps||{};
 Rest=Maps.Rest=Maps.Rest||{};
 Element=Client.Element=Client.Element||{};
 List=WebSharper.List=WebSharper.List||{};
 T=List.T=List.T||{};
 WindowOrWorkerGlobalScope=Global.WindowOrWorkerGlobalScope;
 SC$1=Global.StartupCode$WebSharper_Html_Client$Html=Global.StartupCode$WebSharper_Html_Client$Html||{};
 Text=Client.Text=Client.Text||{};
 Operators$1=Client.Operators=Client.Operators||{};
 MapsLoading=Maps.MapsLoading=Maps.MapsLoading||{};
 SC$2=Global.StartupCode$Bing_Maps$Client=Global.StartupCode$Bing_Maps$Client||{};
 JavaScript=WebSharper.JavaScript=WebSharper.JavaScript||{};
 Pervasives=JavaScript.Pervasives=JavaScript.Pervasives||{};
 Strings=WebSharper.Strings=WebSharper.Strings||{};
 Implementation=Client.Implementation=Client.Implementation||{};
 JQueryHtmlProvider=Implementation.JQueryHtmlProvider=Implementation.JQueryHtmlProvider||{};
 DeprecatedTagBuilder=Client.DeprecatedTagBuilder=Client.DeprecatedTagBuilder||{};
 Collections=WebSharper.Collections=WebSharper.Collections||{};
 List$1=Collections.List=Collections.List||{};
 Attribute=Client.Attribute=Client.Attribute||{};
 SC$3=Global.StartupCode$WebSharper_Html_Client$Events=Global.StartupCode$WebSharper_Html_Client$Events||{};
 SC$4=Global.StartupCode$WebSharper_Bing_Maps_Rest$Rest=Global.StartupCode$WebSharper_Bing_Maps_Rest$Rest||{};
 Unchecked=WebSharper.Unchecked=WebSharper.Unchecked||{};
 Seq=WebSharper.Seq=WebSharper.Seq||{};
 Enumerator=WebSharper.Enumerator=WebSharper.Enumerator||{};
 Object=Global.Object;
 ListEnumerator=Collections.ListEnumerator=Collections.ListEnumerator||{};
 Events=Client.Events=Client.Events||{};
 JQueryEventSupport=Events.JQueryEventSupport=Events.JQueryEventSupport||{};
 T$1=Enumerator.T=Enumerator.T||{};
 IntelliFactory=Global.IntelliFactory;
 Runtime=IntelliFactory&&IntelliFactory.Runtime;
 Main.Samples=function()
 {
  var a,a$1,a$2,a$3,a$4,a$5,a$6,a$7;
  (a=[(a$1=[Tags.Tags().text("Basic map")],Tags.Tags().NewTag("h2",a$1)),Main.MapElement(),(a$2=[Tags.Tags().text("Tile layer")],Tags.Tags().NewTag("h2",a$2)),Main.MapWithTileLayer(),(a$3=[Tags.Tags().text("Map with event management (click me!)")],Tags.Tags().NewTag("h2",a$3)),Main.MouseEvent(),(a$4=[Tags.Tags().text("Search for a location")],Tags.Tags().NewTag("h2",a$4)),Main.LocationRequest(),(a$5=[Tags.Tags().text("Pin a latitude/longitude point")],Tags.Tags().NewTag("h2",a$5)),Main.LatLonLocationRequest(),(a$6=[Tags.Tags().text("Static maps")],Tags.Tags().NewTag("h2",a$6)),Main.StaticMap(),(a$7=[Tags.Tags().text("Retrieve metadata about the images")],Tags.Tags().NewTag("h2",a$7)),Main.ImageMetadata()],Tags.Tags().NewTag("div",a)).AppendTo("main");
 };
 Main.MapElement=function()
 {
  return Main.MakeMapWrapper(function(el)
  {
   return function(api)
   {
    var b,r;
    return(b=(r={},r.credentials=Main.credentials(),r),new self.Microsoft.Maps.Map(el,b)).setMapType(api.MapTypeId.birdseye);
   };
  });
 };
 Main.MapWithTileLayer=function()
 {
  return Main.MakeMapWrapper(function(el)
  {
   return function(api)
   {
    var map,b,r,tileLayer,a,r$1,a$1,r$2;
    map=(b=(r={},r.credentials=Main.credentials(),r.mapTypeId=api.MapTypeId.aerial,r),new self.Microsoft.Maps.Map(el,b));
    tileLayer=(a=(r$1={},r$1.mercator=(a$1=(r$2={},r$2.uriConstructor="https://www.microsoft.com/maps/isdk/ajax/layers/lidar/{quadkey}.png",r$2),new self.Microsoft.Maps.TileSource(a$1)),r$1.opacity=0.7,r$1),new self.Microsoft.Maps.TileLayer(a));
    return map.entities.push(tileLayer);
   };
  });
 };
 Main.MouseEvent=function()
 {
  return Main.MakeMapWrapper(function(el)
  {
   return function(api)
   {
    var map,b,r,pin,a,b$1,r$1;
    map=(b=(r={},r.credentials=Main.credentials(),r),new self.Microsoft.Maps.Map(el,b));
    pin=(a=map.getCenter(),(b$1=(r$1={},r$1.draggable=true,r$1),new self.Microsoft.Maps.Pushpin(a,b$1)));
    map.entities.push(pin);
    api.Events.addHandler(map,"click",function(e)
    {
     var pinLocation,pinPoint,mousePoint,a$1,b$2,mouseLocation;
     e.target.getCenter();
     pinLocation=pin.getLocation();
     pinPoint=map.tryLocationToPixel(pinLocation);
     mousePoint=(a$1=e.getX(),(b$2=e.getY(),new self.Microsoft.Maps.Point(a$1,b$2)));
     mouseLocation=map.tryPixelToLocation(mousePoint);
     Global.alert("pushpin (lat/lon): "+Global.String(pinLocation.latitude)+", "+Global.String(pinLocation.longitude)+"\npushpin (screen x/y): "+Global.String(pinPoint.x)+","+Global.String(pinPoint.y)+"\nmouse (lat/lon): "+Global.String(mouseLocation.latitude)+", "+Global.String(mouseLocation.longitude)+"\nmouse (screen x/y): "+Global.String(mousePoint.x)+","+Global.String(mousePoint.y));
    });
   };
  });
 };
 Main.LocationRequest=function()
 {
  var input,a,button,a$1,responseDiv,a$2;
  input=(a=[Attr.Attr().NewAttr("type","text")],Tags.Tags().NewTag("input",a));
  button=(a$1=[Attr.Attr().NewAttr("type","button"),Attr.Attr().NewAttr("value","Search")],Tags.Tags().NewTag("input",a$1));
  responseDiv=Tags.Tags().NewTag("div",[]);
  a$2=[Main.MakeMapWrapper(function(el)
  {
   return function(api)
   {
    var map,b,r;
    function request(a$3,a$4)
    {
     return Rest.RequestLocationByQuery(Main.credentials(),input.get_Value(),function(r$1)
     {
      Main.GeocodeCallback(api,map,responseDiv,r$1);
     });
    }
    map=(b=(r={},r.credentials=Main.credentials(),r),new self.Microsoft.Maps.Map(el,b));
    map.setMapType(api.MapTypeId.road);
    (function(a$3)
    {
     EventsPervasives.Events().OnClick(function($1)
     {
      return function($2)
      {
       return request($1,$2);
      };
     },a$3);
    }(button),button);
   };
  }),Tags.Tags().NewTag("div",[input,button]),responseDiv];
  return Tags.Tags().NewTag("div",a$2);
 };
 Main.LatLonLocationRequest=function()
 {
  var inputLat,a,inputLon,a$1,button,a$2,responseDiv,a$3,a$4,a$5,a$6;
  inputLat=(a=[Attr.Attr().NewAttr("type","text")],Tags.Tags().NewTag("input",a));
  inputLon=(a$1=[Attr.Attr().NewAttr("type","text")],Tags.Tags().NewTag("input",a$1));
  button=(a$2=[Attr.Attr().NewAttr("type","button"),Attr.Attr().NewAttr("value","Search")],Tags.Tags().NewTag("input",a$2));
  responseDiv=Tags.Tags().NewTag("div",[]);
  a$3=[Main.MakeMapWrapper(function(el)
  {
   return function(api)
   {
    var map,b,r;
    function request(a$7,a$8)
    {
     return Rest.RequestLocationByPoint(Main.credentials(),Global.Number(inputLat.get_Value()),Global.Number(inputLon.get_Value()),T.Empty,function(r$1)
     {
      Main.GeocodeCallback(api,map,responseDiv,r$1);
     });
    }
    map=(b=(r={},r.credentials=Main.credentials(),r),new self.Microsoft.Maps.Map(el,b));
    map.setMapType(api.MapTypeId.road);
    (function(a$7)
    {
     EventsPervasives.Events().OnClick(function($1)
     {
      return function($2)
      {
       return request($1,$2);
      };
     },a$7);
    }(button),button);
   };
  }),(a$4=[(a$5=[Tags.Tags().text("Latitude:")],Tags.Tags().NewTag("span",a$5)),inputLat,(a$6=[Tags.Tags().text("Longitude")],Tags.Tags().NewTag("span",a$6)),inputLon,button],Tags.Tags().NewTag("div",a$4)),responseDiv];
  return Tags.Tags().NewTag("div",a$3);
 };
 Main.StaticMap=function()
 {
  return Main.MakeMapWrapper(function(el)
  {
   return function()
   {
    var req1,r,r$1,r$2,req2,r$3;
    req1=(r={
     imagerySet:"Road"
    },r.centerPoint=new self.Microsoft.Maps.Point(47.2,19.1),r.zoomLevel=10,r.pushpin=[(r$1={
     x:47.1,
     y:19
    },r$1.iconStyle=2,r$1.label="P1",r$1),(r$2={
     x:47.13,
     y:19.17
    },r$2.iconStyle=10,r$2)],r);
    el.appendChild(Rest.StaticMap(Main.credentials(),req1));
    req2=(r$3={
     imagerySet:"Aerial"
    },r$3.query="Washington DC",r$3);
    el.appendChild(Rest.StaticMap(Main.credentials(),req2));
   };
  });
 };
 Main.ImageMetadata=function()
 {
  function callback(answer,result)
  {
   var m,resource,a,x,a$1,x$1;
   function f(a$2)
   {
    return answer.appendChild(a$2);
   }
   function g(v)
   {
   }
   m=Main.CheckJsonResponse(result);
   return m==null?(resource=Arrays.get(Arrays.get(result.resourceSets,0).resources,0),List.iter(function(x$2)
   {
    return g(f(x$2));
   },List.ofArray([(a=[(x="Road map tile size: "+Global.String(resource.imageHeight)+"x"+Global.String(resource.imageWidth),Tags.Tags().text(x))],Tags.Tags().NewTag("p",a)).get_Body(),(a$1=[(x$1="Road map tile URL: "+resource.imageUrl,Tags.Tags().text(x$1))],Tags.Tags().NewTag("p",a$1)).get_Body()]))):void(answer.textContent="Bad metadata response: "+m.$0);
  }
  return Main.MakeMapWrapper(function(el)
  {
   return function()
   {
    var req,r;
    req=(r={
     imagerySet:"Road"
    },r.mapVersion="v1",r.centerPoint=new self.Microsoft.Maps.Point(47.2,19.1),r);
    return Rest.RequestImageryMetadata(Main.credentials(),req,function($1)
    {
     return callback(el,$1);
    });
   };
  });
 };
 Main.MakeMapWrapper=function(f)
 {
  var x,a;
  function f$1(el)
  {
   MapsLoading.OnLoad(f(el.get_Body()));
  }
  x=(a=[Attr.Attr().NewAttr("style","height: 600px;")],Tags.Tags().NewTag("div",a));
  (function(w)
  {
   Operators$1.OnAfterRender(f$1,w);
  }(x));
  return x;
 };
 Main.credentials=function()
 {
  SC$2.$cctor();
  return SC$2.credentials;
 };
 Main.GeocodeCallback=function(api,map,resultElt,result)
 {
  var m,resource,loc,a,b,pin,r;
  m=Main.CheckJsonResponse(result);
  m==null?(resource=Arrays.get(Arrays.get(result.resourceSets,0).resources,0),Main.IsUndefined(resource)?resultElt.set_Text("Location not found or no site around"):(loc=(a=Arrays.get(resource.point.coordinates,0),(b=Arrays.get(resource.point.coordinates,1),new self.Microsoft.Maps.Location(a,b))),pin=new self.Microsoft.Maps.Pushpin(loc),map.entities.push(pin),map.setView((r={},r.center=loc,r)),resultElt.set_Text(resource.name))):resultElt.set_Text("Bad location request: "+m.$0);
 };
 Main.CheckJsonResponse=function(response)
 {
  return Main.IsUndefined(response)||Main.IsUndefined(response.resourceSets)||Arrays.length(response.resourceSets)===0||Main.IsUndefined(Arrays.get(response.resourceSets,0).resources)||Arrays.length(Arrays.get(response.resourceSets,0).resources)===0?{
   $:1,
   $0:Global.String(response.statusCode)+": "+Strings.concat(" ",response.errorDetails)
  }:null;
 };
 Main.IsUndefined=function(x)
 {
  return Unchecked.Equals(typeof x,"undefined");
 };
 Obj=WebSharper.Obj=Runtime.Class({
  Equals:function(obj)
  {
   return this===obj;
  }
 },null,Obj);
 Obj.New=Runtime.Ctor(function()
 {
 },Obj);
 Pagelet=Client.Pagelet=Runtime.Class({
  AppendTo:function(targetId)
  {
   self.document.getElementById(targetId).appendChild(this.get_Body());
   this.Render();
  },
  Render:Global.ignore
 },Obj,Pagelet);
 Pagelet.New=Runtime.Ctor(function()
 {
  Obj.New.call(this);
 },Pagelet);
 Tags.Tags=function()
 {
  SC$1.$cctor();
  return SC$1.Tags$1;
 };
 Operators.FailWith=function(msg)
 {
  throw new Global.Error(msg);
 };
 TagBuilder=Client.TagBuilder=Runtime.Class({
  text:function(data)
  {
   return new Text.New(data);
  },
  NewTag:function(name,children)
  {
   var el,e;
   el=Element.New(this.HtmlProvider,name);
   e=Enumerator.Get(children);
   try
   {
    while(e.MoveNext())
     el.AppendI(e.Current());
   }
   finally
   {
    if(typeof e=="object"&&"Dispose"in e)
     e.Dispose();
   }
   return el;
  }
 },Obj,TagBuilder);
 TagBuilder.New=Runtime.Ctor(function(HtmlProvider)
 {
  Obj.New.call(this);
  this.HtmlProvider=HtmlProvider;
 },TagBuilder);
 Arrays.get=function(arr,n)
 {
  Arrays.checkBounds(arr,n);
  return arr[n];
 };
 Arrays.checkBounds=function(arr,n)
 {
  if(n<0||n>=arr.length)
   Operators.FailWith("Index was outside the bounds of the array.");
 };
 Arrays.length=function(arr)
 {
  return arr.dims===2?arr.length*arr.length:arr.length;
 };
 AttributeBuilder=Client.AttributeBuilder=Runtime.Class({
  NewAttr:function(name,value)
  {
   return Attribute.New(this.HtmlProvider,name,value);
  }
 },Obj,AttributeBuilder);
 AttributeBuilder.New=Runtime.Ctor(function(HtmlProvider)
 {
  Obj.New.call(this);
  this.HtmlProvider=HtmlProvider;
 },AttributeBuilder);
 Attr.Attr=function()
 {
  SC$1.$cctor();
  return SC$1.Attr$1;
 };
 EventsPervasives.Events=function()
 {
  SC$3.$cctor();
  return SC$3.Events;
 };
 Rest.RequestLocationByQuery=function(credentials,query,callback)
 {
  self[Rest.RequestCallbackName()]=callback;
  Rest.SendRequest(Rest.restApiUri()+"Locations?query="+query+"&"+Rest.RequestStringBoilerplate(credentials));
 };
 Rest.RequestLocationByPoint=function(credentials,x,y,entities,callback)
 {
  self[Rest.RequestCallbackName()]=callback;
  Rest.SendRequest(Rest.restApiUri()+"Locations/"+Global.String(x)+","+Global.String(y)+"?"+Rest.RequestStringBoilerplate(credentials)+(entities.$==0?"":"&includeEntityTypes="+Strings.concat(",",entities)));
 };
 Rest.StaticMap=function(credentials,request)
 {
  var img;
  img=self.document.createElement("img");
  img.setAttribute("src",Rest.StaticMapUrl(credentials,request));
  return img;
 };
 Rest.RequestImageryMetadata=function(credentials,request,callback)
 {
  var req,_this;
  self[Rest.RequestCallbackName()]=callback;
  req=Strings.concat("&",Rest.OptionalFields(request,["include","mapVersion","orientation","zoomLevel"]));
  Rest.SendRequest(Rest.restApiUri()+"Imagery/Metadata/"+Global.String(request.imagerySet)+(!Rest.IsUndefined(request.centerPoint)?"/"+(_this=request.centerPoint,_this.x+","+_this.y):"")+"?"+req+"&"+Rest.RequestStringBoilerplate(credentials));
 };
 Rest.RequestCallbackName=function()
 {
  SC$4.$cctor();
  return SC$4.RequestCallbackName;
 };
 Rest.SendRequest=function(req)
 {
  var script;
  script=self.document.createElement("script");
  script.setAttribute("type","text/javascript");
  script.setAttribute("src",req);
  self.document.documentElement.appendChild(script);
 };
 Rest.restApiUri=function()
 {
  SC$4.$cctor();
  return SC$4.restApiUri;
 };
 Rest.RequestStringBoilerplate=function(credentials)
 {
  return"output=json&jsonp="+Rest.RequestCallbackName()+"&key="+credentials;
 };
 Rest.StaticMapUrl=function(credentials,request)
 {
  var fields,query,_this,hasRoute,req;
  fields=List.ofSeq(Seq.delay(function()
  {
   return Seq.append(Rest.OptionalFields(request,["avoid","dateTime","mapLayer","mapVersion","maxSolutions","optimize","timeType","travelMode","zoomLevel"]),Seq.delay(function()
   {
    var _this$1,_this$2;
    return Seq.append(!Rest.IsUndefined(request.mapArea)?[(_this$1=request.mapArea[0],_this$1.x+","+_this$1.y)+","+(_this$2=request.mapArea[1],_this$2.x+","+_this$2.y)]:[],Seq.delay(function()
    {
     return Seq.append(!Rest.IsUndefined(request.mapSize)?[Global.String(request.mapSize[0])+","+Global.String(request.mapSize[1])]:[],Seq.delay(function()
     {
      function pushpinToUrlString(pin)
      {
       return Global.String(pin.x)+","+Global.String(pin.y)+";"+(Rest.IsUndefined(pin.iconStyle)?"":Global.String(pin.iconStyle))+";"+(Rest.IsUndefined(pin.label)?"":pin.label);
      }
      return Seq.append(!Rest.IsUndefined(request.pushpin)?Arrays.map(function(pin)
      {
       return"pp="+pushpinToUrlString(pin);
      },request.pushpin):[],Seq.delay(function()
      {
       return Seq.append(!Rest.IsUndefined(request.waypoints)?Rest.StringifyWaypoints(request.waypoints):[],Seq.delay(function()
       {
        return Seq.append(!Rest.IsUndefined(request.declutterPins)?["dcl="+(request.declutterPins?"1":"0")]:[],Seq.delay(function()
        {
         return!Rest.IsUndefined(request.distanceBeforeFirstTurn)?["dbft="+Global.String(request.distanceBeforeFirstTurn)]:[];
        }));
       }));
      }));
     }));
    }));
   }));
  }));
  query=!Rest.IsUndefined(request.query)?request.query:!Rest.IsUndefined(request.centerPoint)?(_this=request.centerPoint,_this.x+","+_this.y)+"/"+Global.String(request.zoomLevel):"";
  hasRoute=!Rest.IsUndefined(request.waypoints);
  req=Strings.concat("&",fields);
  return Rest.restApiUri()+"Imagery/Map/"+Global.String(request.imagerySet)+"/"+(hasRoute?"Route/":"")+query+"?"+req+"&key="+credentials;
 };
 Rest.IsUndefined=function(x)
 {
  return Unchecked.Equals(typeof x,"undefined");
 };
 Rest.OptionalFields=function(request,arr)
 {
  return Arrays.choose(function(name)
  {
   var value;
   value=request[name];
   return Rest.IsUndefined(value)?null:{
    $:1,
    $0:name+"="+Global.String(value)
   };
  },arr);
 };
 Rest.StringifyWaypoints=function(waypoints)
 {
  return Arrays.mapi(function($1,$2)
  {
   return"wp."+Global.String($1)+"="+Global.String($2);
  },waypoints);
 };
 Element=Client.Element=Runtime.Class({
  get_Value:function()
  {
   return this.HtmlProvider.GetValue(this.get_Body());
  },
  set_Text:function(x)
  {
   this.HtmlProvider.SetText(this.get_Body(),x);
  },
  get_Body:function()
  {
   return this.Dom;
  },
  Render:function()
  {
   if(!this.IsRendered)
    {
     this.RenderInternal();
     this.IsRendered=true;
    }
  },
  AppendI:function(pl)
  {
   var body,r;
   body=pl.get_Body();
   body.nodeType===2?this.HtmlProvider.AppendAttribute(this.get_Body(),body):this.HtmlProvider.AppendNode(this.get_Body(),pl.get_Body());
   this.IsRendered?pl.Render():(r=this.RenderInternal,this.RenderInternal=function()
   {
    r();
    pl.Render();
   });
  }
 },Pagelet,Element);
 Element.New=function(html,name)
 {
  var el,dom;
  el=new Element.New$1(html);
  dom=self.document.createElement(name);
  el.RenderInternal=Global.ignore;
  el.Dom=dom;
  el.IsRendered=false;
  return el;
 };
 Element.New$1=Runtime.Ctor(function(HtmlProvider)
 {
  Pagelet.New.call(this);
  this.HtmlProvider=HtmlProvider;
 },Element);
 T=List.T=Runtime.Class({
  GetEnumerator:function()
  {
   return new T$1.New(this,null,function(e)
   {
    var m;
    m=e.s;
    return m.$==0?false:(e.c=m.$0,e.s=m.$1,true);
   },void 0);
  }
 },null,T);
 T.Empty=new T({
  $:0
 });
 List.iter=function(f,l)
 {
  var r;
  r=l;
  while(r.$==1)
   {
    f(List.head(r));
    r=List.tail(r);
   }
 };
 List.ofArray=function(arr)
 {
  var r,i,$1;
  r=T.Empty;
  for(i=Arrays.length(arr)-1,$1=0;i>=$1;i--)r=new T({
   $:1,
   $0:Arrays.get(arr,i),
   $1:r
  });
  return r;
 };
 List.head=function(l)
 {
  return l.$==1?l.$0:List.listEmpty();
 };
 List.tail=function(l)
 {
  return l.$==1?l.$1:List.listEmpty();
 };
 List.ofSeq=function(s)
 {
  var e,$1,go,r,res,t;
  if(s instanceof T)
   return s;
  else
   if(s instanceof Global.Array)
    return List.ofArray(s);
   else
    {
     e=Enumerator.Get(s);
     try
     {
      go=e.MoveNext();
      if(!go)
       $1=T.Empty;
      else
       {
        res=new T({
         $:1
        });
        r=res;
        while(go)
         {
          r.$0=e.Current();
          e.MoveNext()?r=(t=new T({
           $:1
          }),r.$1=t,t):go=false;
         }
        r.$1=T.Empty;
        $1=res;
       }
      return $1;
     }
     finally
     {
      if(typeof e=="object"&&"Dispose"in e)
       e.Dispose();
     }
    }
 };
 List.listEmpty=function()
 {
  return Operators.FailWith("The input list was empty.");
 };
 SC$1.$cctor=function()
 {
  SC$1.$cctor=Global.ignore;
  SC$1.HtmlProvider=new JQueryHtmlProvider.New();
  SC$1.Attr=new AttributeBuilder.New(Implementation.HtmlProvider());
  SC$1.Tags=new TagBuilder.New(Implementation.HtmlProvider());
  SC$1.DeprecatedHtml=new DeprecatedTagBuilder.New(Implementation.HtmlProvider());
  SC$1.Tags$1=Implementation.Tags();
  SC$1.Deprecated=Implementation.DeprecatedHtml();
  SC$1.Attr$1=Implementation.Attr();
 };
 Text=Client.Text=Runtime.Class({
  get_Body:function()
  {
   return self.document.createTextNode(this.text);
  }
 },Pagelet,Text);
 Text.New=Runtime.Ctor(function(text)
 {
  Pagelet.New.call(this);
  this.text=text;
 },Text);
 Operators$1.OnAfterRender=function(f,w)
 {
  var r;
  r=w.Render;
  w.Render=function()
  {
   r.apply(w);
   f(w);
  };
 };
 MapsLoading.OnLoad=function(f)
 {
  MapsLoading.cbs().push(f);
  self.Microsoft.Maps.MapTypeId?MapsLoading.Loaded():self.WebSharperBingMapsLoaded=function()
  {
   MapsLoading.Loaded();
  };
 };
 MapsLoading.cbs=function()
 {
  SC$4.$cctor();
  return SC$4.cbs;
 };
 MapsLoading.Loaded=function()
 {
  var e,_this,_delete;
  e=new ListEnumerator.New(MapsLoading.cbs());
  try
  {
   while(e.MoveNext$1())
    (e.get_Current())(self.Microsoft.Maps);
  }
  finally
  {
   e.Dispose();
  }
  _this=MapsLoading.cbs();
  _delete=Arrays.length(_this);
  _this.splice.apply(_this,[0,_delete]);
 };
 SC$2.$cctor=function()
 {
  SC$2.$cctor=Global.ignore;
  SC$2.credentials="Ai6uQaKEyZbUvd33y5HU41hvoov_piUMn6t78Qzg7L1DWY4MFZqhjZdgEmCpQlbe";
 };
 Pervasives.NewFromSeq=function(fields)
 {
  var r,e,f;
  r={};
  e=Enumerator.Get(fields);
  try
  {
   while(e.MoveNext())
    {
     f=e.Current();
     r[f[0]]=f[1];
    }
  }
  finally
  {
   if(typeof e=="object"&&"Dispose"in e)
    e.Dispose();
  }
  return r;
 };
 Strings.concat=function(separator,strings)
 {
  return Arrays.ofSeq(strings).join(separator);
 };
 JQueryHtmlProvider=Implementation.JQueryHtmlProvider=Runtime.Class({
  GetValue:function(node)
  {
   return Global.jQuery(node).val();
  },
  SetText:function(node,text)
  {
   node.textContent=text;
  },
  AppendAttribute:function(node,attr)
  {
   this.SetAttribute(node,attr.nodeName,attr.value);
  },
  AppendNode:function(node,el)
  {
   var _this,a;
   _this=Global.jQuery(node);
   a=Global.jQuery(el);
   _this.append.apply(_this,[a]);
  },
  SetAttribute:function(node,name,value)
  {
   Global.jQuery(node).attr(name,value);
  },
  CreateAttribute:function(str)
  {
   return self.document.createAttribute(str);
  }
 },Obj,JQueryHtmlProvider);
 JQueryHtmlProvider.New=Runtime.Ctor(function()
 {
  Obj.New.call(this);
 },JQueryHtmlProvider);
 Implementation.HtmlProvider=function()
 {
  SC$1.$cctor();
  return SC$1.HtmlProvider;
 };
 Implementation.Tags=function()
 {
  SC$1.$cctor();
  return SC$1.Tags;
 };
 Implementation.DeprecatedHtml=function()
 {
  SC$1.$cctor();
  return SC$1.DeprecatedHtml;
 };
 Implementation.Attr=function()
 {
  SC$1.$cctor();
  return SC$1.Attr;
 };
 DeprecatedTagBuilder=Client.DeprecatedTagBuilder=Runtime.Class({},Obj,DeprecatedTagBuilder);
 DeprecatedTagBuilder.New=Runtime.Ctor(function(HtmlProvider)
 {
  Obj.New.call(this);
  this.HtmlProvider=HtmlProvider;
 },DeprecatedTagBuilder);
 List$1=Collections.List=Runtime.Class({
  GetEnumerator:function()
  {
   return Enumerator.Get(this);
  }
 },null,List$1);
 Attribute=Client.Attribute=Runtime.Class({
  get_Body:function()
  {
   var attr;
   attr=this.HtmlProvider.CreateAttribute(this.Name);
   attr.value=this.Value;
   return attr;
  }
 },Pagelet,Attribute);
 Attribute.New=function(htmlProvider,name,value)
 {
  var a;
  a=new Attribute.New$1(htmlProvider);
  a.Name=name;
  a.Value=value;
  return a;
 };
 Attribute.New$1=Runtime.Ctor(function(HtmlProvider)
 {
  Pagelet.New.call(this);
  this.HtmlProvider=HtmlProvider;
 },Attribute);
 SC$3.$cctor=function()
 {
  SC$3.$cctor=Global.ignore;
  SC$3.Events=new JQueryEventSupport.New();
 };
 SC$4.$cctor=function()
 {
  SC$4.$cctor=Global.ignore;
  SC$4.cbs=[];
  SC$4.restApiUri="https://dev.virtualearth.net/REST/v1/";
  SC$4.RequestCallbackName="BingOnReceive";
 };
 Unchecked.Equals=function(a,b)
 {
  var m,eqR,k,k$1;
  if(a===b)
   return true;
  else
   {
    m=typeof a;
    if(m=="object")
    {
     if(a===null||a===void 0||b===null||b===void 0)
      return false;
     else
      if("Equals"in a)
       return a.Equals(b);
      else
       if(a instanceof Global.Array&&b instanceof Global.Array)
        return Unchecked.arrayEquals(a,b);
       else
        if(a instanceof Global.Date&&b instanceof Global.Date)
         return Unchecked.dateEquals(a,b);
        else
         {
          eqR=[true];
          for(var k$2 in a)if(function(k$3)
          {
           eqR[0]=!a.hasOwnProperty(k$3)||b.hasOwnProperty(k$3)&&Unchecked.Equals(a[k$3],b[k$3]);
           return!eqR[0];
          }(k$2))
           break;
          if(eqR[0])
           {
            for(var k$3 in b)if(function(k$4)
            {
             eqR[0]=!b.hasOwnProperty(k$4)||a.hasOwnProperty(k$4);
             return!eqR[0];
            }(k$3))
             break;
           }
          return eqR[0];
         }
    }
    else
     return m=="function"&&("$Func"in a?a.$Func===b.$Func&&a.$Target===b.$Target:"$Invokes"in a&&"$Invokes"in b&&Unchecked.arrayEquals(a.$Invokes,b.$Invokes));
   }
 };
 Unchecked.arrayEquals=function(a,b)
 {
  var eq,i;
  if(Arrays.length(a)===Arrays.length(b))
   {
    eq=true;
    i=0;
    while(eq&&i<Arrays.length(a))
     {
      !Unchecked.Equals(Arrays.get(a,i),Arrays.get(b,i))?eq=false:void 0;
      i=i+1;
     }
    return eq;
   }
  else
   return false;
 };
 Unchecked.dateEquals=function(a,b)
 {
  return a.getTime()===b.getTime();
 };
 Seq.delay=function(f)
 {
  return{
   GetEnumerator:function()
   {
    return Enumerator.Get(f());
   }
  };
 };
 Seq.append=function(s1,s2)
 {
  return{
   GetEnumerator:function()
   {
    var e1,first;
    e1=Enumerator.Get(s1);
    first=[true];
    return new T$1.New(e1,null,function(x)
    {
     var x$1;
     return x.s.MoveNext()?(x.c=x.s.Current(),true):(x$1=x.s,!Unchecked.Equals(x$1,null)?x$1.Dispose():void 0,x.s=null,first[0]&&(first[0]=false,x.s=Enumerator.Get(s2),x.s.MoveNext()?(x.c=x.s.Current(),true):(x.s.Dispose(),x.s=null,false)));
    },function(x)
    {
     var x$1;
     x$1=x.s;
     !Unchecked.Equals(x$1,null)?x$1.Dispose():void 0;
    });
   }
  };
 };
 Arrays.map=function(f,arr)
 {
  var r,i,$1;
  r=new Global.Array(arr.length);
  for(i=0,$1=arr.length-1;i<=$1;i++)r[i]=f(arr[i]);
  return r;
 };
 Arrays.choose=function(f,arr)
 {
  var q,i,$1,m;
  q=[];
  for(i=0,$1=arr.length-1;i<=$1;i++){
   m=f(arr[i]);
   m==null?void 0:q.push(m.$0);
  }
  return q;
 };
 Arrays.ofSeq=function(xs)
 {
  var q,o;
  if(xs instanceof Global.Array)
   return xs.slice();
  else
   if(xs instanceof T)
    return Arrays.ofList(xs);
   else
    {
     q=[];
     o=Enumerator.Get(xs);
     try
     {
      while(o.MoveNext())
       q.push(o.Current());
      return q;
     }
     finally
     {
      if(typeof o=="object"&&"Dispose"in o)
       o.Dispose();
     }
    }
 };
 Arrays.mapi=function(f,arr)
 {
  var y,i,$1;
  y=new Global.Array(arr.length);
  for(i=0,$1=arr.length-1;i<=$1;i++)y[i]=f(i,arr[i]);
  return y;
 };
 Arrays.ofList=function(xs)
 {
  var l,q;
  q=[];
  l=xs;
  while(!(l.$==0))
   {
    q.push(List.head(l));
    l=List.tail(l);
   }
  return q;
 };
 Enumerator.Get=function(x)
 {
  return x instanceof Global.Array?Enumerator.ArrayEnumerator(x):Unchecked.Equals(typeof x,"string")?Enumerator.StringEnumerator(x):x.GetEnumerator();
 };
 Enumerator.ArrayEnumerator=function(s)
 {
  return new T$1.New(0,null,function(e)
  {
   var i;
   i=e.s;
   return i<Arrays.length(s)&&(e.c=Arrays.get(s,i),e.s=i+1,true);
  },void 0);
 };
 Enumerator.StringEnumerator=function(s)
 {
  return new T$1.New(0,null,function(e)
  {
   var i;
   i=e.s;
   return i<s.length&&(e.c=s[i],e.s=i+1,true);
  },void 0);
 };
 ListEnumerator=Collections.ListEnumerator=Runtime.Class({
  MoveNext$1:function()
  {
   this.i=this.i+1;
   return this.i<Arrays.length(this.arr);
  },
  get_Current:function()
  {
   return Arrays.get(this.arr,this.i);
  },
  MoveNext:function()
  {
   return this.MoveNext$1();
  },
  Current:function()
  {
   return Arrays.get(this.arr,this.i);
  },
  Dispose:Global.ignore
 },Obj,ListEnumerator);
 ListEnumerator.New=Runtime.Ctor(function(arr)
 {
  Obj.New.call(this);
  this.arr=arr;
  this.i=-1;
 },ListEnumerator);
 JQueryEventSupport=Events.JQueryEventSupport=Runtime.Class({
  OnMouse:function(name,f,el)
  {
   Global.jQuery(el.get_Body()).on(name,function(ev)
   {
    return f(el,{
     X:ev.pageX,
     Y:ev.pageY,
     Event:ev
    });
   });
  },
  OnClick:function(f,el)
  {
   this.OnMouse("click",function($1,$2)
   {
    return(f($1))($2);
   },el);
  }
 },Obj,JQueryEventSupport);
 JQueryEventSupport.New=Runtime.Ctor(function()
 {
  Obj.New.call(this);
 },JQueryEventSupport);
 T$1=Enumerator.T=Runtime.Class({
  MoveNext:function()
  {
   return this.n(this);
  },
  Current:function()
  {
   return this.c;
  },
  Dispose:function()
  {
   if(this.d)
    this.d(this);
  }
 },Obj,T$1);
 T$1.New=Runtime.Ctor(function(s,c,n,d)
 {
  Obj.New.call(this);
  this.s=s;
  this.c=c;
  this.n=n;
  this.d=d;
 },T$1);
 Runtime.OnLoad(function()
 {
  Main.Samples();
 });
}());


if (typeof IntelliFactory !=='undefined') {
  IntelliFactory.Runtime.ScriptBasePath = '/Content/';
  IntelliFactory.Runtime.Start();
}
