/*!
* load.js
* https://github.com/vistoyn/loadjs
* Copyright (c) 2015 - 2016 Ildar Bikmamatov
* Licensed under the MIT license (http://www.opensource.org/licenses/mit-license.php)
* Version: 1.0
*/
var $ldjs={
	
	/*
		Степень отладки
			0 - ничего не выводить
			1 - выводить deliver
			2 - выводить deliver + load
	*/
	debug: 0,
	
	/*
		Статус загружаемых файлов
		1 - грузится
		2 - загружен
	*/
	st:{
	},
	
	/*
		Массив Callback Функций
		Хранятся объекты вида
		{
			func: function(){},
			arr:[] - массив файлов, которые должны быть загружены, чтобы сработала func
		}
	*/
	cl:[
	],
	
	/*
		Функция срабатывает, когда файл url загружен
	*/
	onLdd: function(url){
		if ($ldjs.debug >= 2) console.log('[load] ' + url);
		
		url = url.split('?').shift();
		$ldjs.st[url]=2;
		
		//console.log($ldjs.st);
		//console.log($ldjs.cl);
		
		// Пройдемся по Callback функциям
		for (var i = $ldjs.cl.length -1; i >= 0 ; i--){
			var cl = $ldjs.cl[i];
			var flag = true;
			for (var j in cl.arr){
				var url2 = cl.arr[j];
				if (typeof $ldjs.st[url2] == 'undefined'){
					flag = false;
					break;
				}
				if ($ldjs.st[url2] != 2){
					flag = false;
					break;
				}
			}
			if (flag){
				var obj = cl.obj;
				$ldjs.cl.splice(i, 1);
				obj.ald();
			}
		}
	},
	
	/*
		Объект с событиями и callback функциями
	*/
	ev:{},
	
	/*
		Таблица состояний
	*/
	ev_st:{},
	
	/*
		Функция, подписывающее на событие
	*/
	subscribe: function(event, func){
		var arr = event;
		if (typeof event == 'string'){
			arr = event.split(',');
		}
		var flag = true;
		for (var i=0;i<arr.length;i++){
			var x = arr[i];
			if (typeof $ldjs.ev_st[x] == 'undefined'){flag = false; break;}
			if ($ldjs.ev_st[x] != 1){flag = false; break;}
		}
		if (flag){
			func();
		}
		else{
			if (typeof event == 'array' || typeof event == 'object') event = event.join(',');
			if (typeof $ldjs.ev[event] == 'undefined') $ldjs.ev[event] = [];
			$ldjs.ev[event].push(func);
		}
	},
	
	/*
		Функция, callback для события
	*/
	deliver: function(event, params){
		if (typeof $ldjs.ev_st[event] != 'undefined')
			if ($ldjs.ev_st[event] == 1)
				return;
		if ($ldjs.debug >= 1) console.log('[deliver] ' + event);
		$ldjs.ev_st[event] = 1;
		for (var z in $ldjs.ev){
			var arr = z.split(',');
			var flag = true;
			for (var i=0;i<arr.length;i++){
				var x = arr[i];
				if (typeof $ldjs.ev_st[x] == 'undefined'){flag = false; break;}
				if ($ldjs.ev_st[x] != 1){flag = false; break;}
			}
			if (flag && arr.indexOf(event) != -1){
				for (var i in $ldjs.ev[z]){
					$ldjs.ev[z][i](params);
				}
			}
		}
	},
	
	deliver_forced: function(event, params){
		$ldjs.ev_st[event] = 0;
		$ldjs.deliver(event, params);
		$ldjs.ev_st[event] = 0;
	},
	
	_load: function (arr, runExecute){
		/*
			runExecute
			0 - не запускать, подождать вызова функции nxt
			1 - сразу запустить
			2 - отслеживать загрузку файлов и когда они загружены запустить success
		*/
		if (typeof runExecute == 'undefined') runExecute = 1;
		
		var obj={
			arr:arr,
			f:[],
			head:document.getElementsByTagName('head')[0] || document.documentElement,
			count:0,
			
			success:null,
			load:null,
			execute: null,
			
			nxt:null, // следующая load функция на запуск
			clbs:null, // callback функция успешной загрзуки всех файлов
			ald:null,
		};
		
		var arr2=[];
		
		obj.success=(function (obj){
			return function(func){
				obj.nxt = $ldjs._load([],0);
				obj.clbs = func;
				return obj.nxt;
			}
		})(obj);
		
		obj.load=(function (obj){
			return function(arr){
				obj.nxt = $ldjs._load(arr,0);
				return obj.nxt;
			}
		})(obj);
		
		/*
			Запускает загрузку следующих файлов в цепочке
		*/
		obj.execute=(function (obj){
			return function(){
				if (obj.count > 0){
					for(var i in obj.f){
						obj.head.appendChild(obj.f[i]);
					}
				}
				else{
					obj.ald();
				}
			}
		})(obj);
		
		obj.ald = (function(obj){
			return function(){
				/* 
					Эта функция вызовется, когда весь arr будет загружен.
					Она должна запустить следующий load
				*/
				if (obj.clbs != null) obj.clbs();
				if (obj.nxt != null) if(obj.nxt.execute != null) obj.nxt.execute(); // Запустить следующую цепочку
			}
		})(obj);
		
		if (runExecute == 2){
			var flag = true;
			for (var i in arr){
				var url = arr[i];
				var url2 = url.split('?').shift();
				arr2.push(url2);
				if (typeof $ldjs.st[url2] != 'undefined'){
					if ($ldjs.st[url2] == 2)
						continue;
				}
				flag = false;
			}
			if (!flag){
				$ldjs.cl.unshift({
					obj:obj,
					arr:arr2,
				});
			}
			else{
				setTimeout(
					(function(obj){
						return function(){
							obj.ald();
						}
					})(obj), 
					1
				);
			}
			return obj;
		}
		
		for (var i in arr){
			var url = arr[i];
			var url2 = url.split('?').shift()
			
			if (typeof $ldjs.st[url2] != 'undefined'){
				continue;
			}
			
			var ext = url.split('.').pop();
			ext = ext.split('?').shift();
			var f=null;
			if (ext == 'js'){
				f = document.createElement('script');
				f.type = 'text/javascript';
				f.src = url;	
				obj.count++;
			}
			else if (ext == 'css'){
				f=document.createElement("link");
				f.setAttribute("rel", "stylesheet");
				f.setAttribute("type", "text/css");
				f.setAttribute("href", url);			
				obj.count++;
			}
			if (f){
				f.onload = (function(url,status){
					return function(){
						if (status == 'success'){
							$ldjs.onLdd(url); // Вызываем функцию успешной загрузки скрипта
						}
					};
				})(url,'success');
				
				f.onerror = (function(url,status){
					return function(){
					};
				})(url,'error');
				
				obj.f.push(f);
				
				$ldjs.st[url2]=1;
				arr2.push(url2);
			}
		}
		
		if (obj.count > 0){
			$ldjs.cl.unshift({
				obj:obj,
				arr:arr2,
			});
		}
		if (runExecute == 1){
			function bindExec(obj){
				return function(){
					obj.execute();
				}
			}
			setTimeout(bindExec(obj), 1);
		}
		
		return obj;
	},
	
	onLoad: function(arr){
		return $ldjs._load(arr, 2);
	},
	
	load: function(arr, deliver){
		return (function (arr, deliver){
			if (typeof deliver == 'undefined') return $ldjs._load(arr);
			return $ldjs._load(arr).success(function(){ $ldjs.deliver(deliver); });
		})(arr, deliver);
	},
	
};
function onJQueryLoad(func){$ldjs.subscribe('jquery_loaded', func);}
function onScriptsLoad(func){$ldjs.subscribe('scripts_loaded', func);}
function onDocumentLoad(func){$ldjs.subscribe('document_loaded', func);}