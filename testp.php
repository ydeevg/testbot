<?

function testFTPnow($ftpserver = '5.17.1.72', $ftpClientDirPort = '6021', $login = 'cloud_erp@flyp.ds', $pass = 'Akc!8cksKd') {

  $conn_id = ftp_connect($ftpserver,$ftpClientDirPort,2);
  if (!$conn_id) {
    echo '<br>[FROM MAJORDOMO (78.108.80.33) <span style="color:#ff0000">NO FTP CONNECTION</span> to '.$ftpserver.':'.$ftpClientDirPort.']';
  } else {
  echo '<br>[FTP CONNECTION to '.$ftpserver.':'.$ftpClientDirPort.']';
    ftp_login($conn_id, $login, $pass);
  }

  if (!$conn_id) {
    echo '<br>[FROM MAJORDOMO (78.108.80.33) FTP LOGIN <span style="color:#ff0000">UNSUCCESS</span> '.$ftpserver.':'.$ftpClientDirPort.']';
  } else {
    ftp_pasv($conn_id, true);
  }



  if ($conn_id) {
    $files = ftp_nlist($conn_id, "*.*");
    echo '<br>-====LIST FILES START====-<br>';

    if (is_array($files))  {
      if (count($files)>0) {
        for ($i = 0; $i < count($files); $i++) {
          echo $files[$i].'<br>';
          if ($i>3){break;}
        }
      }
    }

    echo '<br>-====LIST FILES END====-';
  }
}

 testFTPnow('5.17.1.72','21');
 testFTPnow('5.17.1.72','6021');

// testFTPnow('5.17.1.72','21');
// testFTPnow('5.17.1.72','6021');

//phpinfo();

?>
