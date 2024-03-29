package com.stcu.services;

import java.util.List;
import com.stcu.model.Linea;

public interface LineaService {

    public List<Linea> getAllLineas();

    public Linea getLinea( long id );

    public Linea saveLinea( Linea linea );

    public Linea updateLinea( long id, Linea linea );

    // para app pasajero
    public List<Linea> getLineasActivas();

    //agregado para AppPasajero
    public Linea getLineaByDenom(String denom);
}
