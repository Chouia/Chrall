package main

import (
	"http"
	"fmt"
)


type BestiaryHandler struct {
	Handler
	store *CdmStore
}

func NewBestiaryHandler(store *CdmStore) *BestiaryHandler {
	h := new(BestiaryHandler)
	h.store = store
	return h
}


func (h *BestiaryHandler) ServeHTTP(w http.ResponseWriter, req *http.Request) {
	h.hit()
	h.head(w, "Le Bestiaire de gOgOchrall")
	//aaa := "oh!"
	w.Write([]byte(`
		<script>
		function chooseMonster(name) {
			$("p#resultContent").html("Le nom choisi est... " + name);
			$("#result").show("slow");
		}
		
		$(document).ready(function() {
			$("input#monster_name").autocomplete({
				source: ["cette", "liste", "de", "monstres", "devra", "bientot", "venir", "dynamiquement", "du", "serveur", "vampire", "vouivre"]
			});
			$("input#monster_name").change(function(){
				chooseMonster($(this).val());
			});
		});
		</script>
		<p>Vous faites face au <span class=emphase>Bestiaire</span> de <a class=gogo href=/chrall>gOgOchrall</a></p>
	`))
	
	be, err := h.store.ReadTotalStats()
	if err!=nil {
		fmt.Fprint(w, "<p>La base de données du bestiaire semble innacessible :   <span class=emphase>"+err.String()+"</span></p>")
	} else {
		fmt.Fprintf(w, "<p>Le bestiaire contient actuellement : <span class=emphase>%d</span> CDM concernant <span class=emphase>%d</span> monstres.</p>", be.NbCdm, be.NbMonsters)
	}
		
	w.Write([]byte(`<p>Choisissez un monstre :
				<input id="monster_name" />
		</p>
		<span id=envoi class=invisible>Envoi en cours...</span>
		<div id=result class=invisible>
			<p>
			<span class=emphase>Résultat :</span>
			</p>
			<p id=resultContent>
				Désolé, il semble que le serveur ait trop bu...
			</p>
			<p id=serverMessage>
			</p>
		</div>
	`))
	h.foot(w)
}