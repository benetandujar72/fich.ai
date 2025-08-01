"""
Mòdul per enviar correus electrònics mitjançant Gmail.

Aquest mòdul utilitza les variables d'entorn següents:
    EMAIL_USER: adreça de correu de l'emissor (p. ex. compte Gmail)
    EMAIL_PASSWORD: contrasenya o token d'aplicació de Gmail
    SMTP_SERVER: servidor SMTP (per defecte 'smtp.gmail.com')
    SMTP_PORT: port SMTP (per defecte 587)

Per seguretat, les credencials s'haurien de configurar a Replit utilitzant la
secció de Secrets (Environment Variables) i no s'han d'incloure en codi.

Exemple d'ús:
    from email_sender import send_email
    send_email("usuari@example.com", "Assumpte", "Cos del missatge")
"""

import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


def send_email(to_address: str, subject: str, message_body: str) -> None:
    """Envia un correu electrònic a l'adreça especificada.

    Args:
        to_address (str): destinatari del correu.
        subject (str): assumpte del correu.
        message_body (str): contingut del missatge.

    Raises:
        ValueError: si les credencials no estan configurades.
    """
    user = os.environ.get("EMAIL_USER")
    password = os.environ.get("EMAIL_PASSWORD")
    smtp_server = os.environ.get("SMTP_SERVER", "smtp.gmail.com")
    smtp_port = int(os.environ.get("SMTP_PORT", 587))

    if not user or not password:
        raise ValueError(
            "Les variables d'entorn EMAIL_USER i EMAIL_PASSWORD no estan configurades."
        )

    # Construir el missatge MIME
    msg = MIMEMultipart()
    msg["From"] = user
    msg["To"] = to_address
    msg["Subject"] = subject

    msg.attach(MIMEText(message_body, "plain"))

    # Enviament mitjançant SMTP amb TLS
    with smtplib.SMTP(smtp_server, smtp_port) as server:
        server.starttls()
        server.login(user, password)
        server.sendmail(user, to_address, msg.as_string())

    print(f"Correu enviat correctament a {to_address}")