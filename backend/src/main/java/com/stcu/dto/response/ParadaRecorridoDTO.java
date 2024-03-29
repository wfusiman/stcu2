package com.stcu.dto.response;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

import com.stcu.model.Parada;
import com.stcu.model.ParadaRecorrido;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ParadaRecorridoDTO implements Serializable {

    private long id;
    private ParadaDTO parada;

    private int orden;
    private int distancia;
    private double tiempo;

    public ParadaRecorridoDTO() {
    }

    public ParadaRecorridoDTO(ParadaRecorrido pr) {
        this.id = pr.getId();
        this.parada = new ParadaDTO(pr.getParada());
        // this.recorridoId = pr.getRecorrido().getId();
        this.orden = pr.getOrden();
        this.distancia = pr.getDistancia();
        this.tiempo = pr.getTiempo();
    }

    public static List<ParadaRecorridoDTO> toListParadaRecorridoDTO(List<ParadaRecorrido> list) {
        List<ParadaRecorridoDTO> prList = new ArrayList<ParadaRecorridoDTO>();
        list.forEach(item -> {
            prList.add(toParadaRecorridoDTO(item));
        });
        return prList;
    }

    private static ParadaRecorridoDTO toParadaRecorridoDTO(ParadaRecorrido pr) {
        ParadaRecorridoDTO npr = new ParadaRecorridoDTO();
        npr.setId(pr.getId());
        npr.setParada(new ParadaDTO(pr.getParada()));
        // npr.setParadaCodigo( pr.getParada().getCodigo() );
        // npr.setRecorridoId( pr.getRecorrido().getId() );
        npr.setOrden(pr.getOrden());
        npr.setDistancia(pr.getDistancia());
        npr.setTiempo(pr.getDistancia());

        return npr;
    }

    public static List<ParadaRecorrido> toListParadaRecorrido(List<ParadaRecorridoDTO> listdto) {
        List<ParadaRecorrido> listPR = new ArrayList<ParadaRecorrido>();
        listdto.forEach(item -> {
            ParadaRecorrido pr = new ParadaRecorrido(
                    new Parada(item.getParada().getCodigo(), item.getParada().getDireccion(), null), null);
            pr.setOrden(item.getOrden());
            pr.setDistancia(item.getDistancia());
            pr.setTiempo(item.getTiempo());
            listPR.add(pr);
        });
        return listPR;
    }
}
