package com.unipam.backend.domain.service;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
public final class Senhas {
    private Senhas() {}
    public static String hash(String senha) {
        byte[] salt = new byte[16];
        new SecureRandom().nextBytes(salt);
        return Base64.getEncoder().encodeToString(salt) + ":" + Base64.getEncoder().encodeToString(derive(senha, salt));
    }
    public static boolean conferir(String senha, String hash) {
        if (senha == null || senha.length() > 256) return false;
        String[] parts = hash.split(":");
        return MessageDigest.isEqual(Base64.getDecoder().decode(parts[1]), derive(senha, Base64.getDecoder().decode(parts[0])));
    }
    private static byte[] derive(String senha, byte[] salt) {
        PBEKeySpec spec = new PBEKeySpec(senha.toCharArray(), salt, 210_000, 256);
        try { return SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256").generateSecret(spec).getEncoded(); }
        catch (Exception e) { throw new IllegalStateException("Não foi possível proteger a senha", e); }
        finally { spec.clearPassword(); }
    }
}

