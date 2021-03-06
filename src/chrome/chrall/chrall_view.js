﻿var horizontalViewLimit; // l'horizon actuel, inférieur ou égal à la vue maximale
var grid; // la grille. Tout ce qui est visible est stocké là dedans
var objectsOnPlayerCell;
var isInLaby = false;

function makeDeLink(x, y, z) {
	var cost = (player.cellIsFree ? 1 : 2) + (z===player.z ? 0 : 1);
	if (cost>player.pa) return '';
	return '<a href="javascript:playDE('+(x-player.x)+','+(y-player.y)+','+(z-player.z)+');">DE '+x+' '+y+' '+z+'</a>';
}

/**
 * construit la ligne de boites à cocher permettant de filtrer la grille
 */
function Chrall_makeFiltersHtml() {
	html = '';
	html += "<form class=gridFiltersForm>";
	if (player.totalSight>5) {
		html += '<img title="Centre la vue sur votre troll" id=goto_player class=butt src="'+chrome.extension.getURL("player_target.png")+'">';
		html += "Horizon : <select id=viewRedux>";
		html += "<option value="+horizontalViewLimit+">Actuel (vue de "+horizontalViewLimit+")</option>";
		if (horizontalViewLimit!=4 && player.totalSight>4) {
			html += "<option value=4>Intime (vue de 4)</option>";
		}
		if (horizontalViewLimit!=6 && player.totalSight>6) {
			html += "<option value=6>Proche (vue de 6)</option>";
		}
		if (horizontalViewLimit!=8 && player.totalSight>8) {
			html += "<option value=8>Ordinaire (vue de 8)</option>";
		}
		if (horizontalViewLimit!=12 && player.totalSight>12) {
			html += "<option value=12>Lointain (vue de 12)</option>";
		}
		if (horizontalViewLimit!=20 && player.totalSight>20) {
			html += "<option value=20>Très lointain (vue de 20)</option>";
		}
		if (horizontalViewLimit!=player.totalSight) {
			html += "<option value="+player.totalSight+">Max (vue de "+player.totalSight+")</option>";
		}		
		html += "</select> &nbsp;";	
	}
	for (var key in viewFilters) {
		html += "<span><input type=checkbox id='"+key+"'";
		if (viewFilters[key]) html += " checked";
		html += " onClick=\"grid_changeDisplayByName('"+key+"', this.checked?'inline':'none');\"";
		html += "><label for='"+key+"'>"+key+"</label></span>";
	}
	html += "</form>";
	return html;
}

/**
 * construit le HTML de la grille. Ce HTML est construit une fois pour toute, le filtrage opérant via des modifications de style.
 * 
 * Cette fonction n'est utilisée que pour la grille de la vue principale, pas pour les vues "zoom" qui proviennent du serveur chrall.
 */ 
function Chrall_makeGridHtml() {	
	var grey_closed_png_url = chrome.extension.getURL("grey_closed.png");
	var grey_open_png_url = chrome.extension.getURL("grey_open.png");
	var h=0;
	var html = [];
	html[h++] = "<script>";
	html[h++] = "function playDE(dx, dy, dz){";
	html[h++] = " parent.chrall_de_dx.value=dx;";
	html[h++] = " parent.chrall_de_dy.value=dy;";
	html[h++] = " parent.chrall_de_dz.value=dz;";
	html[h++] = " parent.frames['Action'].location.href='Play_action.php?ai_ToDo=112&amp;as_Action=ACTION!';";
	html[h++] = "";
	html[h++] = "}";
	html[h++] = "</script>";
	
	html[h++] = "<table id=grid class=grid><tbody>";
	html[h++] = "<tr><td bgcolor=#BABABA></td><td colspan=" + (xmax-xmin+3) + " align=center>Nordhikan (Y+)</td><td bgcolor=#BABABA></td></tr>";
	html[h++] = "<tr>";
	html[h++] = "<td nowrap rowspan="+(ymax-ymin+3)+"\"><span style='display:block;-webkit-transform:rotate(-90deg);transform:rotate(-90deg);-moz-transform:rotate(-90deg);margin-left:-30px;margin-right:-30px;'>Oxhykan&nbsp;(X-)</span></td>";
	html[h++] = "<td align=center height=30 width=30>y\\x</td>";
	for (var x=xmin; x<=xmax; x++) {
		html[h++] = "<td class=grad>"+x+"</td>";
	}
	html[h++] = "<td align=center height=30 width=30>x/y</td>";
	html[h++] = "<td rowspan="+(ymax-ymin+3)+" ><span style='display:block;transform:rotate(90deg);-webkit-transform:rotate(90deg);-moz-transform:rotate(90deg);margin-left:-30px;margin-right:-30px;'>Orhykan&nbsp;(X+)</span></td>";
	html[h++] = "</tr>\n";
	for (var y=ymax; y>=ymin; y--) {
		html[h++] = "<tr><td class=grad height=30>"+ y + "</td>\n";
		for (var x=xmin; x<=xmax; x++) {
			var hdist = player.hdist(x, y);
			var cell = grid.getCellOrNull(x, y);
			var hasHole = false;
			var cellContent = [];
			var c = 0; 
			var cellId=null;
			if (x===player.x && y===player.y) {
				cellContent[c++] = "<a class=ch_player href=\"javascript:EPV("+player.id+");\"";
				cellContent[c++] = " id="+player.id;
				if (player.isIntangible) cellContent[c++] = " intangible";
				cellContent[c++] = ">"+player.z+":Vous êtes ici</a>";
				cellId='cellp0p0';
			}
			if (cell) {
				if (cell.trolls) {
					for (var i=0; i<cell.trolls.length; i++) {
						var t = cell.trolls[i];
						if (c>0) cellContent[c++] = "<br name='trolls' class=ch_troll>";
						var an = player.z!=t.z;
						if (an) cellContent[c++] = "<span name=3D>";
						cellContent[c++] = "<a name='trolls' class=ch_troll href=\"javascript:EPV("+t.id+");\"";
						cellContent[c++] = ' message="en X='+x+' Y='+y+' Z='+t.z+'<br>Distance horizontale : ' + hdist+'"';
						cellContent[c++] = " id="+t.id;
						if (t.isIntangible) cellContent[c++] = " intangible";
						cellContent[c++] = ">"+t.z+": "+t.name+"&nbsp;"+t.race[0]+t.level+"</a>";
						if (an) cellContent[c++] = "</span>";
					}
				}
				if (cell.monsters) {
					for (var i=0; i<cell.monsters.length; i++) {
						var m = cell.monsters[i];
						if (m.isGowap) {
							if (c>0) cellContent[c++] = "<br name='gowaps' class=ch_gowap>";
							var an = player.z!=m.z;
							if (an) cellContent[c++] = "<span name=3D>";
							cellContent[c++] = "<a name='gowaps' class=ch_gowap href=\"javascript:EMV("+m.id+",750,550);\"";
							cellContent[c++] = ' message="'+m.fullName+' ( '+m.id+' )<br>en X='+x+' Y='+y+' Z='+m.z+'<br>Distance horizontale : ' + hdist+'"';
							cellContent[c++] = ">"+m.z+": "+m.name+"";
							if (m.isSick) cellContent[c++] = "<span class=ch_tag>[M]</span>";
							cellContent[c++] = "</a>";
							if (an) cellContent[c++] = "</span>";
						} else {
							if (c>0) cellContent[c++] = "<br name='monstres' class=ch_monster>";
							var an = player.z!=m.z;
							if (an) cellContent[c++] = "<span name=3D>";
							cellContent[c++] = "<a name='monstres' class=ch_monster href=\"javascript:EMV("+m.id+",750,550);\"";
							cellContent[c++] = ' message="'+m.fullName+' ( '+m.id+' )<br>en X='+x+' Y='+y+' Z='+m.z+'<br>Distance horizontale : ' + hdist+'"';
							cellContent[c++] = " id="+m.id;
							cellContent[c++] = " nom_complet_monstre=\""+encodeURIComponent(m.fullName)+"\"";
							cellContent[c++] = ">"+m.z+": "+m.fullName+"</a>";
							if (an) cellContent[c++] = "</span>";
						}
					}
				}
				if (cell.places) {
					for (var i=0; i<cell.places.length; i++) {
						var t = cell.places[i];
						if (t.isHole) {
							hasHole = true;
						} else {
						if (c>0) cellContent[c++] = "<br name='lieux' class=ch_place>";
							var an = player.z!=t.z;
							if (an) cellContent[c++] = "<span name=3D>";
							cellContent[c++] = "<a name='lieux' class=ch_place";
							if (t.hasLink) cellContent[c++] = ' href="javascript:Enter(\'/mountyhall/View/TaniereDescription.php?ai_IDLieu='+t.id+'\',750,500)"';
							cellContent[c++] = ">"+t.z+": "+t.name+"</a>";
							if (an) cellContent[c++] = "</span>";
						}
					}
				}
				if (cell.objects) {
					//> on regroupe les objets par étage et pour chaque étage on les compte afin de ne pas afficher des milliers de lignes quand une tanière est écroulée
					var objectsByLevel = {};
					for (var i=0; i<cell.objects.length; i++) {
						var t = cell.objects[i];
						if (!objectsByLevel[t.z]) {
							objectsByLevel[t.z] = new Array();
						}
						objectsByLevel[t.z].push(t);
					}
					for (var level in objectsByLevel) {
						var list = objectsByLevel[level];
						var merge = list.length>3;				
						if (merge) {
							if (c>0) cellContent[c++] = "<br name='trésors' class=ch_object>";
							var divName = "objects_"+(x<0?"_"+(-x):x)+"_"+(y<0?"_"+(-y):y)+"_"+(-level);
							var an = player.z!=level;
							if (an) cellContent[c++] = "<span name=3D>";
							cellContent[c++] = "<span name='trésors' class=ch_object>" + level + " : ";
							cellContent[c++] = "<a class=ch_objects_toggler href=\"javascript:grid_changeDisplayByName('"+divName+"');\">";
							cellContent[c++] = "<b>"+list.length+" trésors</b>";
							cellContent[c++] = "</a>";
							cellContent[c++] = "<div name="+divName+" class=hiddenDiv>";
							if (an) cellContent[c++] = "</span>";
						}
						for (var i=0; i<list.length; i++) {
							var t = list[i];
							if (c>0) cellContent[c++] = "<br name='trésors' class=ch_object>";
							var an = player.z!=t.z;
							if (an) cellContent[c++] = "<span name=3D>";
							cellContent[c++] = "<span name='trésors' bub=\""+t.id+" : "+t.name+"\" class=ch_object>"+t.z+": "+t.name+"</span>"; // note :pb à attendre si le nom du trésor contient un guillement
							if (an) cellContent[c++] = "</span>";
						}
						if (merge) {
							cellContent[c++] = "</div></span>";
						}		
					}
				}
				if (cell.mushrooms) {
					for (var i=0; i<cell.mushrooms.length; i++) {
						var t = cell.mushrooms[i];
						if (c>0) cellContent[c++] = "<br name='champignons' class=ch_mushroom>";
						var an = player.z!=t.z;
						if (an) cellContent[c++] = "<span name=3D>";
						cellContent[c++] = "<a name='champignons' class=ch_mushroom>"+t.z+": "+t.name+"</a>";
						if (an) cellContent[c++] = "</span>";
					}					
				}
				if (cell.cenotaphs) {
					for (var i=0; i<cell.cenotaphs.length; i++) {
						var t = cell.cenotaphs[i];
						if (c>0) cellContent[c++] = "<br name='cénotaphes' class=ch_cenotaph>";
						var an = player.z!=t.z;
						if (an) cellContent[c++] = "<span name=3D>";
						cellContent[c++] = "<a name='cénotaphes' class=ch_cenotaph>"+t.z+": "+t.name+"</a>";
						if (an) cellContent[c++] = "</span>";
					}					
				}
			
				// S'il y a un mur, c'est probablement qu'on est dans un labyrinthe et que la vue est limitée à 1.
				// On va donc se permettre d'afficher toutes les cases de la même taille pour que ce soit plus joli.
				// Pour bien faire, il faudrait fixer initialement la taille des cases à une certaine taille si on est dans un labyrinthe.
				// Ainsi, tout se centrarait bien sans souci. (Là c'est une peu tard pour le faire, y a un peu de bidouille...)
				// On va aussi mettre une image de mur en arrière fond pour les cases qui en sont
				// A noter qu'on se limite au minimum, mais je pense que ça suffit pour Chrall.
				// (Dans la version normale toujours accessible dans l'onglet murs et couloirs d'ailleurs, il y a des images de trolls, de lieux, ...)
				if (cell.walls) {
					for (var i=0; i<cell.walls.length; i++) {
						var t = cell.walls[i];
						if (c>0) cellContent[c++] = "<br name='murs' class=ch_wall>";
						if (t.name == "Mur") {
							//On met une image de mur en background et on n'affiche rien dans la case, chrall suffit pour obtenir les coordonnées.
							cellContent[c++] = '<div style="background-image:url(http://games.mountyhall.com/mountyhall/View/IMG_LABY/mur.gif);background-repeat:repeat;min-height:160;min-width:160"/>';
						} else {	
							// Compte le nombre d'éléments dans la case. L'utilité sera d'estimer plus ou moins la hauteur de la case en fonction de ce qu'elle contient.
							// On aurait pu le faire avce un compteur tout au long du parcours global des éléments, mais comme l'utilité sera très spécifique au labyrinthe, autant le faire ici.
							var elementsNumber = 0;
							if (cell.trolls) elementsNumber += cell.trolls.length;
							if (cell.monsters) elementsNumber += cell.monsters.length;
							if (cell.places) elementsNumber += cell.places.length;
							if (cell.objects) elementsNumber += cell.objects.length;
							if (cell.mushrooms) elementsNumber += cell.mushrooms.length;
							if (cell.cenotaphs) elementsNumber += cell.cenotaphs.length;
							
							// On affiche le couloir dans un div dont la hauteur est relative au nombre d'éléments dans cette case.
							// C'est très approcimatif, clairement pas au pixel prêt, mais ça permet plus ou moins de garder des cases carrées tant qu'il n'y a pas trop déléments dedans.
							// (Par exemple, ça ne prend pas en compte qu'un élément est affiché ou non pour définir la hauteur de base.)
							// A noter qu'avec ce fonctionnement, les éléments d'un couloir sont listés en haut de la case, et en sont donc plus centrés.
							// Je n'affiche pas le z de profondeur avant le mot couloir. Un labyrinthe est plat, et de toute façon on a encore l'info pour tous les autres trucs de la vue, notamment soi-même dans la case centrale.
							var minHeight = Math.max(0, 160-elementsNumber*20);
							cellContent[c++] = '<div style="min-height:'+minHeight+';min-width:160;align:center"><a  style="align:center;color:#969696" name="murs" class=ch_wall >(' + t.name+ ')</a></div>';
						}
					}
				}
			}
				
			html[h++] = "<td class=d"+((hdist-horizontalViewLimit+20001)%2);
			html[h++] = " grid_x=" + x;
			html[h++] = " grid_y=" + y;
			if ( (horizontalViewLimit == 0) && ( (player.x != x) || (player.y != y) ) ) {
				// Si on est aveugle, on indique que les cases autour sont inconnues avec un point d'interrogation.
				// La vue étant minimaliste dans ce cas-là, on peut fixer une taille par défaut pour les cases.
				html[h++] = " uncharted";
			}
			if (cellId!=null) html[h++] = ' id='+cellId;
			var deRange = player.z===0 ? 2 : 1;
			var cellIsAccessibleByDe = x>=player.x-deRange && x<=player.x+deRange && y>=player.y-deRange && y<=player.y+deRange;
			if (c>0 || cellIsAccessibleByDe) html[h++] = " hasContent";
			html[h++] = ">";
			if (hasHole===true) {
				html[h++] = "<span class=ch_place>Trou de Météorite</span>";
			}
			html[h++] = cellContent.join('');
			html[h++] = "</td>\n";
		}
		html[h++] = "<td class=grad height=30>"+ y + "</td></tr>";
	}
	html[h++] = "<tr>";
	html[h++] = "<td align=center height=30 width=30>y/x</td>";
	for (var x=xmin; x<=xmax; x++) {
		html[h++] = "<td class=grad>"+x+"</td>";
	}
	html[h++] = "<td align=center height=30 width=30>x\\y</td>";
	html[h++] = "</tr>";
	html[h++] = "<tr><td bgcolor=#BABABA></td><td colspan=" + (xmax-xmin+3) + " align=center>Mydikan (Y-)</td><td bgcolor=#BABABA></td></tr>";
	html[h++] = "</tbody></table>";
	return html.join('');
}


// OPTM : le plus long, dans cette opération, est le append de la grille, c'est-à-dire la construction par le browser de la
//         page. Il me semble difficile d'optimiser ça.
//         "table-layout: fixed;" ne change rien
function Chrall_analyseAndReformatView() {
	var time_enter = (new Date()).getTime(); // <= prof
		
	//> on analyse la vue
	var $tables = Chrall_analyseView();
	
	//> on vire la frise latérale
	$("td[width=55]").remove();
	//> on vire la bannière "Mounty Hall la terre des trolls" qu'on a vu pendant 5 ans déjà...
	$("tr").first().remove();
	//> on vire le titre "Ma Vue" et les liens vers les tableaux
	$("table table table").first().remove();
	$("table table center").first().remove();
	$('td[height="1000"]').removeAttr('height'); // c'est compliqué souvent de déperversifier les pages MH...
	
	var time_after_cleaning = (new Date()).getTime(); // <= prof	

	//> on colle en haut à droite les liens [Refresh] et [Logout]
	var refreshLogout = $("table table div");
	refreshLogout.addClass("floatTopRight");

	var time_before_grid = (new Date()).getTime(); // <= prof
	
	//> on reconstruit la vue en répartissant les tables dans des onglets et en mettant la grille dans le premier
	//var tables = $("table.mh_tdborder");
	var html = []
	var h = 0;
	html[h++] = "<ul id=tabs_view class=tabs view>";
	html[h++] = "<li><a href=#tabGrid>Grille</a></li>";
	//onglet spécifique pour les murs et couloirs dans les pocket hall de type labyrinthe
	if (isInLaby) {
		html[h++] = "<li><a href=#tabWalls>Murs et couloirs</a></li>";
	}	
	html[h++] = "<li><a href=#tabTrolls>Trolls ("+grid.nbTrollsInView+")</a></li>";
	html[h++] = "<li><a href=#tabMonsters>Monstres ("+grid.nbMonstersInView+")</a></li>";
	html[h++] = "<li><a href=#tabPlaces>Lieux ("+grid.nbPlacesInView+")</a></li>";
	html[h++] = "<li><a href=#tabObjects>Trésors ("+grid.nbObjectsInView+")</a></li>";
	html[h++] = "<li><a href=#tabMushrooms>Champignons ("+grid.nbMushroomsInView+")</a></li>";
	html[h++] = "<li><a href=#tabCenotaphs>Cénotaphes ("+grid.nbCenotaphsInView+")</a></li>";
	html[h++] = "<li><a href=#tabSettings>Réglages</a></li>";
	html[h++] = "<li><a href=#tabPartages>Partages</a></li>";
	html[h++] = "<li><a href=#tabRecherche>Recherche</a></li>";
	html[h++] = "</ul>";
	html[h++] = "<div class=tab_container view>";
	html[h++] = "<div id=tabGrid class=tab_content>";
	html[h++] = Chrall_makeFiltersHtml();
	html[h++] = "<div id=grid_holder>";
	html[h++] = Chrall_makeGridHtml();
	html[h++] = "</div>";
	html[h++] = "</div>";
	if (isInLaby) html[h++] = "<div id=tabWalls class=tab_content scroll></div>";
	html[h++] = "<div id=tabTrolls class=tab_content scroll></div>";
	html[h++] = "<div id=tabMonsters class=tab_content scroll></div>";
	html[h++] = "<div id=tabPlaces class=tab_content scroll></div>";
	html[h++] = "<div id=tabObjects class=tab_content scroll></div>";
	html[h++] = "<div id=tabMushrooms class=tab_content scroll></div>";
	html[h++] = "<div id=tabCenotaphs class=tab_content scroll></div>";
	html[h++] = "<div id=tabSettings class=tab_content scroll></div>";
	html[h++] = "<div id=tabPartages class=tab_content scroll></div>";
	html[h++] = "<div id=tabRecherche class=tab_content scroll></div>";
	if (isInLaby) {
		html[h++] = "<div id=tabWalls class=tab_content scroll></div>";
	}
	html[h++] = "</div>";
	
	var time_after_grid_building = (new Date()).getTime(); // <= prof
	
	$("table.mh_tdborder").first().parent().parent().prepend(html.join(''));
	$("#tabSettings").append($(document.getElementsByName("LimitViewForm")[0])); // on déplace le formulaire de limitation de vue, avec la table qu'il contient (c'est tables[0] mais on a besoin du formulaire pour que les boutons fonctionnent)
	//onglet spécifique pour les murs et couloirs dans les pocket hall de type labyrinthe
	if (isInLaby) $("#tabWalls").append($tables['murs']);		
	$("#tabMonsters").append($tables['monstres']);
	$("#tabTrolls").append($tables['trolls']);
	$("#tabObjects").append($tables['tresors']);
	$("#tabMushrooms").append($tables['champignons']);
	$("#tabPlaces").append($tables['lieux']);
	$("#tabCenotaphs").append($tables['cadavre']);
	$("#tabPartages").append(makePartageTables());
	makeSearchPanel($("#tabRecherche"));
	$(".tab_content").hide();
	
	if (localStorage['tab_view']) {
		$('#tabs_view li:has(a[href="#'+localStorage['tab_view']+'"])').addClass("active").show();
		$('#'+localStorage['tab_view']).show();
		localStorage.removeItem('tab_view');
	} else {
		$("#tabs_view li:first").addClass("active").show();
		$(".tab_content:first").show();
	}
	var changeTab = function($tab) {
		hideOm(); // fermeture des éventuels objectMenus de la grille
		$("#tabs_view li").removeClass("active");
		$tab.addClass("active");
		$(".tab_content").hide();
		var activeTab = $tab.find("a").attr("href");
		window.scroll(0, 0);
		$(activeTab).fadeIn("fast");
	}
	$("#tabs_view li").click(function() { changeTab($(this)); });
	// on corrige les liens internes, pour qu'ils agissent sur les onglets
	$('a[href$="#monstres"]').click(function() { changeTab($('#tabs_view a[href="#tabMonsters"]').parent()); });
	$('a[href$="#trolls"]').click(function() { changeTab($('#tabs_view a[href="#tabTrolls"]').parent()); });
	$('a[href$="#tresors"]').click(function() { changeTab($('#tabs_view a[href="#tabObjects"]').parent()); });
	$('a[href$="#champignons"]').click(function() { changeTab($('#tabs_view a[href="#tabMushrooms"]').parent()); });
	$('a[href$="#lieux"]').click(function() { changeTab($('#tabs_view a[href="#tabPlaces"]').parent()); });
	$('a[href$="#cadavre"]').click(function() { changeTab($('#tabs_view a[href="#tabCenotaphs"]').parent()); });
	
	var time_after_grid_append = (new Date()).getTime(); // <= prof

	$('#grid_holder').dragscrollable({dragSelector: '#grid'});
	
	//> on applique les réglages de filtrages de la fois précédente
	for (var key in viewFilters) {
		var display = localStorage['grid_filter_'+key];
		if (display!=null) {
			var os = document.getElementsByName(key);
			for (var i=0; i<os.length; i++) {
				os[i].style.display=display;
			}
			if (display!='none') $('#'+key).attr("checked", "checked");
			else $('#'+key).removeAttr("checked");
		}
	}

	setTimeout( // afin d'accélérer l'affichage initial, on repousse un peu l'ajout des bulles et menus
		function() {
			Chrall_gridLive();
			//> bulle popup sur le lien du joueur
			var link = $("#grid a.ch_player");
			var trollId = link.attr('id');
			if (trollId==0) {
				bubble(link, "Problème. Peut-être avez vous mis à jour Chrall sans rouvrir la session MH. Utilisez le bouton 'Refresh' de MH.", "bub_player");
			} else {
				bubble(link, '', "bub_player", GOGOCHRALL+"json?action=get_troll_info&trollId="+trollId, trollId);
			}
	
			//> on met un popup sur les trésors pour afficher leur numéro (utile pour le pilotage de gowap)
			$("#grid span.ch_object").each(
				function() {
					var o = $(this);
					var text = o.attr("bub");
					if (text) {
						bubble(o, text, "bub_object");
					} else {
						bubble(o, "Cliquez pour voir tous ces trésors", "bub_object");
					}
				}
			);
			
		}, 1000
	);

	//> on outille le select de réduction de vue
	$('#viewRedux').change(function(){
		var limit  = $(this).val();
		document.getElementsByName("ai_MaxVue")[0].value = limit;
		document.getElementsByName("ai_MaxVueVert")[0].value = Math.ceil(limit/2);
		$('form[name="LimitViewForm"]').submit();
	});
	
	var $gridHolder = $('#grid_holder');
	var $playerCell = $('#cellp0p0');
	var gotoPlayer = function() {
		hideOm();
		scrollInProgress = true;
		$gridHolder.animate(
			{
				scrollLeft: ($gridHolder.scrollLeft()+$playerCell.offset().left + ($playerCell.innerWidth()-window.innerWidth)/2),
				scrollTop: ($gridHolder.scrollTop()+$playerCell.offset().top + ($playerCell.innerHeight()-window.innerHeight)/2)
			},
			'slow',
			function() {
				scrollInProgress = false;
			}
		);
	}
	//> on centre la vue sur la cellule du joueur
	setTimeout(
		gotoPlayer,
		100
	);
	//> bouton de centrage
	$('#goto_player').click(gotoPlayer);
	//> hook pour le centrage au double-clic
	$('#grid').dblclick(gotoPlayer);
	
	var time_end = (new Date()).getTime(); // <= prof
	console.log("Profiling - Vue de " + horizontalViewLimit);
	console.log("Duration Cleaning : " + (time_after_cleaning-time_enter));
	console.log("Duration Analysis : " + (time_before_grid-time_after_cleaning));
	console.log("Duration Grid Building: " + (time_after_grid_building-time_before_grid));
	console.log("Duration Grid Append : " + (time_after_grid_append-time_after_grid_building));
	console.log("Duration Bubbles : " + (time_end-time_after_grid_append));
	console.log("Total Duration : " + (time_end-time_enter));
	
	// On corrige si nécessaire la position affichée dans le menu de gauche et on signale
	// cette position au script de fond
	updateTroll();
	
}
