/************************************************************************************
*  Bouncer.js  |  
*************************************************************************************
*  Author: Rory Taca
*  
*  A Bouncer is an object-event intended on capturing e-mail subscriptions. 
*  It will handle the creation, display, eventHandling, cookie management, 
*  and google data tracking.
*
************************************************************************************/
(function() {
	/*****************************
	****** GLOBAL VARIABLES ******
	*****************************/
	//cookie names and variables
	var cSignedup = "Signedup";

	var cOverlayBouncerViewed = "OverlayBouncerViewed";
	var cOverlayBouncerViewedCurrent = "OVerlayBouncerCurrentSession";
	
	var signupBouncerExpiration = 3; //Days
	
	//other variables
	var deviceType = isTabletAndMobileBrowser() ? "mobile" : "desktop";

	/*******************************
	****** Main Bouncer class ******
	*******************************/
	var Bouncer = function(ele, trigger_ele, behaviors, repeat_fire, type) {
		this.main_ele = ele;	
		this.trigger_ele = trigger_ele;
		this.behaviors = behaviors;
		this.bouncer_type = type;
		this.initialize();
	}
	
	Bouncer.prototype = {
	    initialize: function() {
	      /* Abstract Method */
	    },    
	    create: function() {
	      /* Abstract Method */
	    },
	    setEventHandlers: function() {
	      this.setDefaultEvents();
	      if (deviceType == "mobile") {
	        this.setMobileEvents();
	      } else {
	        this.setDesktopEvents();
	      }
	    },
	    setDefaultEvents: function() {
	      /* Abstract Method */
	      /* Set all standard (across device) event listeners necessary */
	    },
	    setMobileEvents: function() {
	      /* Abstract Method */
	      /* Mobile events are custom animations normally and aren't triggered by 
	         preset behavioral events, but rather preset ones.
	      */
	    },
    	setDesktopEvents: function() {
			var bouncer = this;
			var behaviors = this.behaviors;
			var ele = this.main_ele;
			var trigger_ele = this.trigger_ele;
 
 			//Set all trigger behaviors
			behaviors.forEach(function(behavior,index) {
				//If mouse leaves target Ele
				if (behavior[0] == "mouseleave") {
					$(trigger_ele).on("mouseleave", function() {
						bouncer.fire();
					});
				//If set time elapses
				} else if (behavior[0] == "timed") {
					var time = behavior[1]*1000;
					setTimeout(function(){
						bouncer.fire();
					},time);
				//If target ele is entered
				} else if (behavior[0] == "mouseover") {
					$(trigger_ele).on("mouseover", function() {
						bouncer.fire();
					});
				//If target position is scrolled passed
				} else if (behavior[0] == "scrollpassed") {
					var marker;
					if (typeof behavior[1] === "number") {
						marker = behavior[1];
					} else if (typeof behavior[1] === "string") {
						marker = $(behavior[1]).offset().top;
					}
					$(window).scroll(function () {
						if ($(window).scrollTop() > marker) {
							bouncer.fire();
						} 
					});
				//If user scrolls up after passing threshold
				} else if (behavior[0] == "scrollback") {
					var thresh;
					var thresholdPassed = false
					var lastScrollTop = 0;

					if (typeof behavior[1] === "number") {
						thresh = behavior[1];
					} else if (typeof behavior[1] === "string") {
						thresh = $(behavior[1]).offset().top;
					}

					$(window).scroll(function () {
						var scrollTop = $(window).scrollTop();
						if (scrollTop > thresh) {
							if (thresholdPassed == true && scrollTop < lastScrollTop) {
								bouncer.fire();
							}
							thresholdPassed = true;
						} 
						lastScrollTop = scrollTop;
					});
				}
			});
    	},
		fire: function() {
			/* Abstract Method */
		},
		disable: function() {
			/* Abstract Method */
		},
		isDisabled: function() {
			/* Abstract Method */
		},
		setCookie: function(cookieName, value, expire) {
			var d = new Date();
			d.setTime(d.getTime() + (expire*24*60*60*1000));
			d = d.toUTCString();
			value = encodeURI(value)+((expire==null)?'':'; expires='+d);
			document.cookie = cookieName+'='+value+'; path=/;'
		},
		getCookie: function(cookieName) {
			var cookies = document.cookie.split('; ');
			var ret = {};
			for (var i = cookies.length - 1; i >= 0; i--) {
				var el = cookies[i].split('=');
				// ret[el[0]] = el[1];
				if (el[0] === cookieName) {
				  return el[1];
				}
			}
			return null;
		}
	}

	/*******************************
	******** Overlay Class *********
	*******************************/
	var Overlay = function() { 
		Bouncer.apply(this,arguments);
	}

	Overlay.prototype = Object.create(Bouncer.prototype);

	Overlay.prototype.initialize = function() {
		if(this.isDisabled()) {
			return;
		} else {
			this.create();
		}
	}

	Overlay.prototype.create = function() {
		this.setEventHandlers();
	}

	Overlay.prototype.setMobileTriggers = function() {  
		var bouncer = this;
		var ele = this.main_ele;
		var startPos = 0;
		var endPos = 0;
		var thresh = 200;

		$(window).on("touchstart",function(e){
			startPos = $(window).scrollTop();
		});
		$(window).on("touchend",function(e){
			endPos = $(window).scrollTop();
			if (endPos - startPos < 0 && startPos > thresh){
				bouncer.fire();
			}
		});     
	};

	Overlay.prototype.setDefaultEvents = function() {
	    var bouncer = this;
	    var behaviors = this.behaviors;
	    var ele = this.main_ele;
	    var trigger_ele = this.trigger_ele

	    
	    $(ele, "input").prop('disabled', false);
	    console.log("beep");
		//TODO: set overlay - x out event
		//TODO: Google analytics events 
		//TODO: Form validation / Success ajex:beforeSend
		//TODO: Ajax:success event on form
	};

	Overlay.prototype.fire = function() {
		if (this.isDisabled()) {  return;    }
		
		var ele = this.main_ele;
		$(ele).toggleClass("hidden");
		$(ele).animate({'opacity':'1.0'},500,'linear');
		$('html, body').css({
			'overflow-y': 'hidden',
			'height': '100%'
		});

		//TODO: Google Analytics: fire

		this.disable();
	};

	Overlay.prototype.disable = function() {
		//Disabled state determined by cookies
		this.setCookie(cOverlayBouncerViewed, true, null);
		this.setCookie(cOverlayBouncerViewedCurrent, true, null);

	}
	Overlay.prototype.isDisabled = function() {
		return (this.getCookie(cOverlayBouncerViewed) == "true" || this.getCookie(cSignedup) == "true");
	};	
	/************************************************************************************
	********************************  Utility functions *********************************
	************************************************************************************/
	function isMobileBrowser() {
		var check = false;
		//mobile only
		(function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)))check = true})(navigator.userAgent||navigator.vendor||window.opera);
		return check;
	}

	function isTabletAndMobileBrowser() {
		var check = false;
		//mobile and tablet
		(function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)))check = true})(navigator.userAgent||navigator.vendor||window.opera);
		return check;
	}

	function userExists() {
		//Custom Function for checking if user exists if possible via clientside.
	    return false;
	}



	var bouncer = new Overlay(".bouncer-overlay", "html", [["mouseleave"]], false, "signup");
})();