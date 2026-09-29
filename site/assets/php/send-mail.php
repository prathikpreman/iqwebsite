<?php
/**
 * send-mail.php
 * ---------------------------------------------------------------------
 * Plain-PHP mail() handler for the site's two forms (careers.html and
 * contact.html). No external service, no library, no account signup —
 * just PHP's built-in mail() function, which your hosting's mail
 * transfer agent (MTA) delivers from.
 *
 * IMPORTANT — before this works you must:
 *   1. Set $recipient_email below (already set to your address).
 *   2. Set $site_domain below to your real domain (used to build a
 *      From: address on YOUR domain — sending "From" an arbitrary
 *      visitor email address gets flagged as spoofing by most mail
 *      providers, Gmail included, so this script always sends FROM an
 *      address on your own domain and puts the visitor's real address
 *      in Reply-To instead — hit "Reply" in your inbox and it goes
 *      straight to them).
 *   3. Confirm your host has PHP's mail() function enabled (most
 *      shared hosting does; a few restrict or disable it — if emails
 *      never arrive and this script reports success, that's the first
 *      thing to check with your host).
 *
 * Deliverability note: plain mail() has no authentication (no SPF/
 * DKIM alignment with your domain), so depending on your host, mail
 * may land in spam rather than the inbox — especially for a Gmail
 * recipient. Check your spam folder first. If it's consistently
 * filtered, the fix is proper SPF/DKIM records for your domain
 * (something your host or a transactional mail provider sets up) —
 * ask if you want help with that later.
 * ---------------------------------------------------------------------
 */

// ---- Configuration -----------------------------------------------------

$recipient_email = 'prathik.preman@innovateq.digital';

// Used to build the From: address (e.g. noreply@yourdomain.com). If left
// as 'localhost' it falls back to this server's own hostname, which is
// fine to start with but a real domain here helps deliverability.
$site_domain = $_SERVER['SERVER_NAME'] ?? 'localhost';

$max_upload_bytes = 8 * 1024 * 1024; // 8MB cap on the resume attachment
$allowed_resume_types = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
$allowed_resume_exts = ['pdf', 'doc', 'docx'];

// ---- Basic request checks -----------------------------------------------

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed.']);
    exit;
}

function field(string $key): string {
    $value = $_POST[$key] ?? '';
    return is_string($value) ? trim($value) : '';
}

// Strip anything that could be used for header injection (CR/LF) — this
// matters for any value we might place into a mail header (name, email,
// subject-like fields), not just the body.
function clean_header_value(string $value): string {
    return trim(preg_replace('/[\r\n]+/', ' ', $value));
}

$name    = field('name');
$email   = field('email');
$subject_field = field('subject'); // contact form
$area    = field('area');          // careers form
$message = field('message');

if ($name === '' || $email === '' || $message === '') {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Missing required fields.']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Invalid email address.']);
    exit;
}

$name = clean_header_value($name);
$email = clean_header_value($email);

// The page's hidden <input name="_subject"> tells us which form this is
// and gives a sensible default line.
$form_subject = clean_header_value(field('_subject') ?: 'New website submission — iNNOVATEQ');
if ($subject_field !== '') {
    $form_subject .= ': ' . clean_header_value($subject_field);
}

// ---- Build the email body ------------------------------------------------

$lines = [];
$lines[] = "New submission from the iNNOVATEQ website";
$lines[] = str_repeat('-', 40);
$lines[] = "Name: {$name}";
$lines[] = "Email: {$email}";
if ($area !== '') {
    $lines[] = "Area of interest: {$area}";
}
if ($subject_field !== '') {
    $lines[] = "Subject: {$subject_field}";
}
$lines[] = '';
$lines[] = 'Message:';
$lines[] = $message;
$body_text = implode("\n", $lines);

// ---- Optional resume attachment (careers form only) ----------------------

$attachment = null; // ['filename' => ..., 'mime' => ..., 'data' => ...]

if (isset($_FILES['resume']) && $_FILES['resume']['error'] !== UPLOAD_ERR_NO_FILE) {
    $file = $_FILES['resume'];

    if ($file['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Resume upload failed.']);
        exit;
    }
    if ($file['size'] > $max_upload_bytes) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Resume file is too large (8MB max).']);
        exit;
    }

    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $detected_type = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);

    if (!in_array($ext, $allowed_resume_exts, true) || !in_array($detected_type, $allowed_resume_types, true)) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Resume must be a PDF or Word document.']);
        exit;
    }

    $data = file_get_contents($file['tmp_name']);
    if ($data === false) {
        http_response_code(500);
        echo json_encode(['ok' => false, 'error' => 'Could not read uploaded file.']);
        exit;
    }

    // Keep the filename header-safe too.
    $safe_name = preg_replace('/[^A-Za-z0-9._-]/', '_', basename($file['name']));

    $attachment = [
        'filename' => $safe_name,
        'mime' => $detected_type,
        'data' => $data,
    ];
    $body_text .= "\n\n(Resume attached: {$safe_name})";
}

// ---- Assemble and send the email -----------------------------------------

$from_address = 'noreply@' . preg_replace('/[^A-Za-z0-9.-]/', '', $site_domain);
$to = $recipient_email;
$subject = $form_subject;

if ($attachment === null) {
    // Simple plain-text email — no attachment needed.
    $headers = [];
    $headers[] = "From: iNNOVATEQ Website <{$from_address}>";
    $headers[] = "Reply-To: {$name} <{$email}>";
    $headers[] = "MIME-Version: 1.0";
    $headers[] = "Content-Type: text/plain; charset=UTF-8";

    $sent = mail($to, $subject, $body_text, implode("\r\n", $headers));
} else {
    // multipart/mixed email built by hand — a text part plus one file
    // attachment — using PHP's mail() directly (no library).
    $boundary = 'ntq-' . bin2hex(random_bytes(16));

    $headers = [];
    $headers[] = "From: iNNOVATEQ Website <{$from_address}>";
    $headers[] = "Reply-To: {$name} <{$email}>";
    $headers[] = "MIME-Version: 1.0";
    $headers[] = "Content-Type: multipart/mixed; boundary=\"{$boundary}\"";

    $body = "--{$boundary}\r\n";
    $body .= "Content-Type: text/plain; charset=UTF-8\r\n";
    $body .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
    $body .= $body_text . "\r\n\r\n";

    $body .= "--{$boundary}\r\n";
    $body .= "Content-Type: {$attachment['mime']}; name=\"{$attachment['filename']}\"\r\n";
    $body .= "Content-Transfer-Encoding: base64\r\n";
    $body .= "Content-Disposition: attachment; filename=\"{$attachment['filename']}\"\r\n\r\n";
    $body .= chunk_split(base64_encode($attachment['data']));
    $body .= "--{$boundary}--";

    $sent = mail($to, $subject, $body, implode("\r\n", $headers));
}

if ($sent) {
    http_response_code(200);
    echo json_encode(['ok' => true]);
} else {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'The server could not send the email. Check that PHP mail() is enabled on this host.']);
}
