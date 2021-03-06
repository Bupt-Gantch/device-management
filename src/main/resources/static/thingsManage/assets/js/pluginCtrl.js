mainApp.controller("pluginCtrl", function ($scope, $resource){

    var str = new Array();
    var lang_flag=getCookie('Language');

    $(".pluginRightView").hide();

    var pluginGroup = $resource('/api/rule/allPlugins');
    $scope.pluginGroups = pluginGroup.query();
    console.log("pluginGroups:");
    console.log($scope.pluginGroups);

    /*鼠标移入动画效果*/
    $scope.fadeSiblings = function () {
        $(".pluginChoose").mouseover(function () {
            $(this).siblings().stop().fadeTo(300, 0.3);
            $(this).css("border-color","#38883C");
        });
    };
    /*鼠标移出动画效果*/
    $scope.reSiblings = function () {
        $(".pluginChoose").mouseout(function () {
            $(this).siblings().stop().fadeTo(300, 1);
            $(this).css("border-color","#C0C0C0");
        });
    };

    $scope.showAll = function (item) {
        str = [];//初始化数组；
        //console.log(str);
        //console.log(item);
        /*除点击元素外其他元素均无特殊样式*/
        // $scope.pluginGroups.forEach(function (items) {
        //     if(item != items) items.style = {}
        // });
        /*给点击元素加上特定样式*/
        // item.style = {"border": "2px solid #468847"};

        $("#pluginIcon").hide();

        $(".pluginRightView").show();

        var pluginName= item.name.toLowerCase();
        console.log(pluginName);
        $scope.name = item.name;
        $scope.url = item.url;
        $scope.describe = item.describe;
        //console.log($scope.url);
        str = item.url.split(":");
        //console.log(str);//正常显示str数组
        var pluginState = $resource('/api/plugin/state/:urlId/:portId',{urlId: '@id', portId: '@id'});
        pluginState.get({urlId:str[0],portId:str[1]}).$promise.then(function (resp) {
        $scope.pluginStateDisplay=resp;
            //插件状态展现
            if (resp.state == "ACTIVE") {
                $scope.isActive = true;
            } else {
                $scope.isActive = false;
            }
        })
        //获取插件所有接口
        var interfaceInfo = $resource('/api/plugin/allUrls/:hostID/:portID',{hostID:"@id",portID:"@id"});
        interfaceInfo.get({hostID:str[0],portID:str[1]}).$promise.then(function(res){
            $scope.interfaceInfomations = res;
            var arrs = [];
            var arry = [];
            arrs = $scope.interfaceInfomations.api;
            for(var i=0;i<arrs.length;i++){
                if(arrs[i].indexOf("/api/v1")== -1){
                    console.log("内语言"+lang_flag);
                    if(lang_flag==1){
                        $scope.interface = "内部";
                    }
                    else{
                        $scope.interface = "Internal";
                    }
                    var fileData = {"name":$scope.interfaceInfomations.api[i],"value":$scope.interface};
                    arry.push(fileData);//重新构建数组对象

                }else{
                    console.log("外语言"+lang_flag);
                    if(lang_flag==1){
                        $scope.interface = "外部";
                    }
                    else{
                        $scope.interface = "External";
                    }
                    var fileData = {"name":$scope.interfaceInfomations.api[i],"value":$scope.interface};
                    arry.push(fileData);
                }

            }
            $scope.interfaceArray = arry;
        })

        /*================查看插件运行状态websocket==========*/
        var stompClient = null;


        // 开启socket连接
        function connect() {
            var socket = new SockJS('http://47.105.120.203:30080/api/v1/smartruler/socket');
            stompClient = Stomp.over(socket);
            stompClient.connect(
                {}
                , function () {
                    //alert("Connected!") ;
                    //alert("begin to send") ;

                    stompClient.send("/plugins/metrics/details", {}, pluginName+":"+str[1]) ;

                    var res = stompClient.subscribe("/plugins/metrics/response/"+pluginName+"/"+str[1], function(frame){
                        console.log(frame.body);
                        var jsonObj =  JSON.parse(frame.body);
                        var newArr = [];
                        $.each(jsonObj, function(i,val) {
                            //console.log(i); //获取键值
                            //console.log(val);
                            if(i != "requestCount"){
                                newArr.push(val);
                            }

                        });
                        //console.log(newArr);
                        $scope.frameBody = jsonObj.requestCount;
                        $scope.MailController = newArr[0];


                        /*=====================================
                        var json1 = frame.body;
                        var adaper = function (json) {
                            var newArr = [];
                            var map = {
                                "requestCount": 1,
                                "MailController": 2
                            }
                            for(var i in map){
                                newArr[map[i]] = json[i];
                            }
                            return newArr;
                        }
                        adaper(json1);
                        //console.log(json1);

                        var info = json1.replace("com.tjlcast.mailPlugin.controller.MailController","MailController");
                        //console.log(info);
                        var jsonObj =  JSON.parse(info);
                        //console.log(jsonObj);
                        //console.log(jsonObj.MailController);
                        var json1 = frame.body;
                        var info = json1.replace("com.tjlcast.mailPlugin.controller.MailController","MailController");
                        var jsonObj =  JSON.parse(info);
                        $scope.frameBody = jsonObj.requestCount;
                        $scope.mailController = jsonObj.MailController;
                        ======================================================*/

                    }) ;
                    //console.log(res) ;
                });
        }

        // 断开socket连接
        function disconnect() {
            if (stompClient != null) {
                stompClient.disconnect();
            }
            setConnected(falses);
            //alert("Disconnected");
        }

        // 向‘/app/change-notice’服务端发送消息
        function sendName() {
            var value = "hello tjlcast.";
            //alert("send" + value) ;
            stompClient.send("/app/change-notice", {}, value);
        }

        function subscribe_app() {
            stompClient.subscribe("/app/app_subscribe", function(frame){
                console.log(frame) ;
            })
        }

        connect() ;
    };

    $("#backToPlugin").click(function () {
        $(".pluginRightView").hide();
        $("#pluginIcon").show();
    });


    /*激活插件*/
    $scope.activePlugin = function(){
        //console.log(str[0]);
        var changePlugin = $resource('/api/plugin/activate/:urlNum/:portNum',{urlNum: str[0], portNum:str[1]});
        changePlugin.save({urlNum:str[0],portNum:str[1]})
            .$promise.then(function (resp) {
            //alert("sssss")
            //console.log(resp);
            if(lang_flag==1){
                toastr.success("激活成功！");
            }
            else{
                toastr.success("Successfully activated！");
            }
            setTimeout(function () {
                window.location.reload();
            },500);
        });
    }
    /*暂停插件*/
    $scope.stopPlugin = function () {
        console.log(str[0]);
        var changePlugin = $resource('/api/plugin/suspend/:urlDig/:portDig',{urlDig: str[0], portDig: str[1]})
        changePlugin.save({urlDig:str[0],portDig:str[1]})
            .$promise.then(function (resp) {
            //alert("sssss")
            //console.log(resp);
            if(lang_flag==1){
                toastr.success("暂停成功！");
            }
            else{
                toastr.success("Successfully paused！");
            }
            setTimeout(function () {
                window.location.reload();
            },500);
        });
    }


    /*实现向上滚动显示数据
    * scrollTop 0.1
    * Dependence jquery-1.7.1.js
    */
    ;(function($){
        $.fn.scrollTop = function(options){
            var defaults = {
                speed:30
            }
            var opts = $.extend(defaults,options);
            this.each(function(){
                var $timer;
                var scroll_top=0;
                var obj = $(this);
                var $height = obj.find("ul").height();
                obj.find("ul").clone().appendTo(obj);
                obj.hover(function(){
                    clearInterval($timer);
                },function(){
                    $timer = setInterval(function(){
                        scroll_top++;
                        if(scroll_top > $height){
                            scroll_top = 0;
                        }
                        obj.find("ul").first().css("margin-top",-scroll_top);
                    },opts.speed);
                }).trigger("mouseleave");
            })
        }
    })(jQuery)
    $(function(){
        $("#box").scrollTop({
            speed:70 //数值越大 速度越慢
        });
    })


});

function getCookie(Name) {
    var search = Name + "="
    if(document.cookie.length > 0)
    {
        offset = document.cookie.indexOf(search)
        if(offset != -1)
        {
            offset += search.length
            end = document.cookie.indexOf(";", offset)
            if(end == -1)
                end = document.cookie.length
            return unescape(document.cookie.substring(offset, end))
        }
        else return ""
    }
}