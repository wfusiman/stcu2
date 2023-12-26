package com.stcu.controllers;

import java.util.List;
import java.util.logging.Logger;

import com.stcu.model.Colectivo;
import com.stcu.services.ColectivoServiceImp;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;

@RestController
@RequestMapping("/api")
public class ColectivoController {

    @Autowired
    ColectivoServiceImp service;

    private static final Logger log = Logger.getLogger(ColectivoController.class.getName());

    /**
     * Recupera listado de colectivos completa.
     * 
     * @return
     */
    @GetMapping("/colectivos")
    public String findAllColectivos() {
        log.info("*** findAllColectivos");
        List<Colectivo> list = service.getAllColectivos();
        log.info("*** Colectivos length: " + list.size());
        Response<List<Colectivo>> response = new Response<List<Colectivo>>(false, 200, "Listado de colectivos", list);
        return Mapper.getResponseAsJson(response);
    }

    /**
     * Busca y retorna un objeto colectivo por su id.
     * 
     * @param id
     * @return
     */
    @GetMapping("/colectivo/{id}")
    public String findColectivo(@PathVariable long id) {
        log.info("*** findColectivo: " + id);
        Colectivo col = service.getColectivo(id);
        Response<Colectivo> response;
        if (col != null) {
            log.info("*** colectivo: " + col.getUnidad());
            response = new Response<Colectivo>(false, 200, "Colectivo id " + id, col);
        } else {
            log.warning("*** No se encontro colectivo " + id);
            response = new Response<Colectivo>(true, 400, "No se encontro colectivo id = " + id, null);
        }
        return Mapper.getResponseAsJson(response);
    }

    /**
     * Registra un nuevo colectivo
     * 
     * @param col: datos del colectivo a registrar
     * @return
     */
    @PostMapping("/colectivos")
    public String saveColectivo(@RequestBody Colectivo col) {
        log.info("*** saveColectivo: " + col.getUnidad());
        Colectivo colectivo = service.saveColectivo(col);
        Response<Colectivo> response;
        if (colectivo != null) {
            log.info("*** Colectivo registrado: " + col.getId());
            response = new Response<Colectivo>(false, 200, "Nuevo Colectivo registrado", colectivo);
        } else {
            log.warning("*** No se pudo registrar colectivo");
            response = new Response<Colectivo>(true, 400, "No se pudo registrar nuevo colectivo", null);
        }
        return Mapper.getResponseAsJson(response);
    }

    /**
     * Actualiza los datos de un colectivo registrado
     * 
     * @param id:  del colectivo a actualizar
     * @param col: nuevos datos a actualizar.
     * @return
     */
    @PutMapping("/colectivo/{id}")
    public String updateColectivo(@PathVariable long id, @RequestBody Colectivo col) {
        log.info("*** updateColectivo: " + id);
        Colectivo colectivo = service.updateColectivo(id, col);
        Response<Colectivo> response;
        if (colectivo != null) {
            log.info("*** Colectivo actualizado " + id);
            response = new Response<Colectivo>(false, 200, "Colectivo " + id + " actualizado", colectivo);
        } else {
            log.warning("*** No se puedo actualizar colectivo " + id);
            response = new Response<Colectivo>(true, 400, "No se pudo actualizar colectivo " + id, null);
        }
        return Mapper.getResponseAsJson(response);
    }

    /**
     * Setea la baja de un colectivo.
     * 
     * @param id
     * @return
     */
    @GetMapping("/colectivo/baja/{id}")
    public String bajaColectivo(@PathVariable long id) {
        log.info("*** bajaColectivo: " + id);
        boolean stat = service.bajaColectivo(id);
        if (stat)
            log.info("*** Colectivo " + id + " se dio de baja");
        else
            log.warning("*** No se pudo dar de baja colectivo " + id);
        Response<Boolean> resp = new Response<Boolean>(true, 200,
                stat ? "Unidad " + id + " de baja" : "No se pudo dar de baja unidad " + id, stat);
        return Mapper.getResponseAsJson(resp);
    }
}
