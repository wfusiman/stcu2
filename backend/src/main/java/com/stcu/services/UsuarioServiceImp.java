package com.stcu.services;

import java.util.Calendar;
import java.util.List;
import java.util.Optional;

import com.stcu.model.Usuario;
import com.stcu.repository.UsuarioRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.Sort;

import java.util.logging.Logger;

@Service
public class UsuarioServiceImp implements UsuarioService {

    @Autowired
    private UsuarioRepository rep;

    @Override
    public List<Usuario> getAllUsuarios() {
        return this.rep.findAll(Sort.by(Sort.Direction.DESC, "id"));
    }

    @Override
    public Usuario getUsuario(long id) {
        return this.rep.findById(id);
    }

    public Optional<Usuario> getUsuario(String usr) {
        return this.rep.findByUsuario(usr);
    }

    @Override
    public Usuario saveUsuario(Usuario usuario) {

        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(); // Encripta password
        usuario.setPasswd(encoder.encode(usuario.getPasswd()));

        return this.rep.save(usuario);
    }

    @Override
    public Usuario updateUsuario(long id, Usuario usuario) {
        Usuario usr = this.rep.findById(id);
        usr.setNombre(usuario.getNombre());
        usr.setApellido(usuario.getApellido());
        usr.setDni(usuario.getDni());
        usr.setDireccion(usuario.getDireccion());
        usr.setEmail(usuario.getEmail());
        usr.setSuperusuario(usuario.isSuperusuario());
        usr.setTelefono(usuario.getTelefono());

        usr.setRoles(usuario.getRoles());

        return this.rep.save(usr);
    }

    @Override
    public boolean validateUsuario(String username, String pwd) {

        Usuario usuario = this.rep.findByUsuario(username).get();
        if (usuario != null) {
            BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
            return encoder.matches(pwd, usuario.getPasswd());
        }
        return false;
    }

    /**
     * Chanbia la password para un usuario con id.
     * 
     * @param id      identificador de usuario
     * @param pass    password actual
     * @param newpass nueva password a actualizar
     * @return codido de respuesta: -1 si no se encontro usuario, -2 si el password
     *         actual es incorrecto, 1 si se actualizo correctamente.
     */
    @Override
    public int changePass(long id, String pass, String newpass) {
        Usuario usuario = this.rep.findById(id);
        if (usuario != null) {
            BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
            if (encoder.matches(pass, usuario.getPasswd())) {
                usuario.setPasswd(encoder.encode(newpass));
                this.rep.save(usuario);
                return 1;
            } else
                return -2;
        }
        return -1;
    }

    @Override
    public boolean deactivateUsuario(long id) {
        Usuario usuario = this.rep.findById(id);
        if (usuario != null) {
            usuario.setEstado("NO_ACTIVO");
            usuario.setBaja(Calendar.getInstance());
            this.rep.save(usuario);
            return true;
        }
        return false;
    }

    @Override
    public boolean activateUsuario(long id) {
        Usuario usuario = this.rep.findById(id);
        if (usuario != null) {
            usuario.setEstado("ACTIVO");
            this.rep.save(usuario);
            return true;
        }
        return false;
    }

}
