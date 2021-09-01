+++
title = "AWS クライアントVPNを試してみた"
template = "documents_section.html"
page_template = "documents_page.html"
[extra]
root_section = "documents/aws_client_vpc/_index.md"
+++

# はじめに

- 本記事は、とりあえず一度試してみよう、という方向けに手順を書いています。AWS Client VPNについての情報、リンク等は最後にまとめています。
- Windows 10 Pro バージョン 20H2 で実施しました。
- 本記事の手順で作成する証明書（CA証明書、クライアント証明書、サーバ証明書）はいずれも有効期限が**作成から10年**となるようです。
- 結構がっつりハンズオンみたいな資料になってしまいました😋

# 構成図

![構成図](aws_client_vpc/assets/diaglam1.png)

# 手順

## 前提

AWSアカウントは作成済とします

## 必要なソフトの準備

OpenVPN クライアントと、vpnux PKI Managerの2つのソフトを準備します。
ダウンロード元ページは → [こちら](https://www.openvpn.jp/download/)

### OpenVPN クライアント

1. [上記のページ](https://www.openvpn.jp/download/)から「Windowsインストーラ（64ビット版）」をダウンロードする

1. ダウンロードしたmsiファイルをダブルクリックして実行する

1. 「Install Now」を選択する
    ![main_2021-07-25-12-11-04](aws_client_vpc/assets/main_2021-07-25-12-11-04.png)
※ユーザーアカウント制御のダイアログが出たら、「はい」を選択する

1. インストールが完了したら、「Close」を選択する
    ![main_2021-07-25-12-14-22](aws_client_vpc/assets/main_2021-07-25-12-14-22.png)

1. プロファイルが無いよ、というダイアログが出るが、気にせず「OK」を選択する
    ![main_2021-07-25-12-24-41](aws_client_vpc/assets/main_2021-07-25-12-24-41.png)

### vpnux PKI Manager

#### .NET Framework 3.5が入っているか確認する

1. Windowsキー + 「R」キーを押下して、「ファイル名を指定して実行」を表示させる

1. 「appwiz.cpl」と入力し、Enterキーを押下する
    ![main_2021-07-25-12-21-52](aws_client_vpc/assets/main_2021-07-25-12-21-52.png)

1. 「Windowsの機能の有効化または無効化」を選択する
    ![main_2021-07-25-21-12-55](aws_client_vpc/assets/main_2021-07-25-21-12-55.png)

1. .NET Framework 3.5のところが有効になっているか確認する
    ![main_2021-07-25-12-31-01](aws_client_vpc/assets/main_2021-07-25-12-31-01.png)

#### インストール

1. [上記のページ](https://www.openvpn.jp/download/)から「vpnux PKI Manager」をダウンロード

1. ダウンロードしたzipファイルを解凍し、任意のフォルダに置く

## 相互認証用の証明書の作成

### プライベートCAの構築

1. vpnux PKI Manager（vpnuxPKI.exe）を実行する
1. 新規CA構築のダイアログにて、「OK」を選択する
    ![main_2021-07-25-13-06-26](aws_client_vpc/assets/main_2021-07-25-13-06-26.png)

1. 「CAの新規作成」を選択する
    ![main_2021-07-25-13-07-36](aws_client_vpc/assets/main_2021-07-25-13-07-36.png)

1. 確認ダイアログが開くので、「はい」を選択する
    ![main_2021-07-25-13-08-38](aws_client_vpc/assets/main_2021-07-25-13-08-38.png)

1. 任意のフォルダを選択し、「OK」を選択する
    ![main_2021-07-25-13-12-36](aws_client_vpc/assets/main_2021-07-25-13-12-36.png)

1. 確認ダイアログが開くので、フォルダの中身を確認した後に「はい」を選択する
    ![main_2021-07-25-13-15-53](aws_client_vpc/assets/main_2021-07-25-13-15-53.png)

1. 適宜証明書基本情報を入力し、「CA証明書作成」を選択する（ここではデフォルトのままにしている）
    ![main_2021-07-25-13-18-21](aws_client_vpc/assets/main_2021-07-25-13-18-21.png)

1. しばらく時間がかかるので、待機する
1. CA構築が完了したら、ダイアログが表示されるので、「OK」を選択する
    ![main_2021-07-25-13-20-53](aws_client_vpc/assets/main_2021-07-25-13-20-53.png)

1. 証明書等が入ったフォルダが表示される
    ![main_2021-07-25-13-25-42](aws_client_vpc/assets/main_2021-07-25-13-25-42.png)

### サーバ証明書の作成

1. vpnux PKI Managerにて、「サーバー用 秘密鍵/証明書」を選択する
    ![main_2021-07-25-13-30-31](aws_client_vpc/assets/main_2021-07-25-13-30-31.png)

1. 適宜証明書情報を入力し、「証明書作成」を選択する（ここでは`server.client-vpc-handson-20210725-sakainako.com`とした）  
    **ドメインとして認識されるような名前をつけておく。デフォルトの「server_1」ではACMへの登録時にドメインが認識されなかった**
    ![main_2021-07-25-15-43-17](aws_client_vpc/assets/main_2021-07-25-15-43-17.png)

1. サーバ証明書作成が完了したら、ダイアログが表示されるので、「OK」を選択する
    ![main_2021-07-25-13-39-40](aws_client_vpc/assets/main_2021-07-25-13-39-40.png)

1. サーバ証明書が作成されていることを確認する
    ![main_2021-07-25-15-44-35](aws_client_vpc/assets/main_2021-07-25-15-44-35.png)

### クライアント証明書の作成

1. vpnux PKI Managerにて、「クライアント用 秘密鍵/証明書」を選択する
    ![main_2021-07-25-13-43-07](aws_client_vpc/assets/main_2021-07-25-13-43-07.png)

1. 適宜証明書情報を入力し、「証明書作成」を選択する（ここでは`client.client-vpc-handson-20210725-sakainako.com`とした）
    ![main_2021-07-25-15-46-45](aws_client_vpc/assets/main_2021-07-25-15-46-45.png)

1. クライアント証明書作成が完了したら、ダイアログが表示されるので、「OK」を選択する
    ![main_2021-07-25-13-46-02](aws_client_vpc/assets/main_2021-07-25-13-46-02.png)

1. クライアント証明書が作成されていることを確認する
    ![main_2021-07-25-15-47-43](aws_client_vpc/assets/main_2021-07-25-15-47-43.png)

## 相互認証用の証明書をACM（Amazon Certificate Manager）へ登録

1. AWSコンソールの「サービス」から「Certificate Manager」を選択する
    ![main_2021-07-25-14-00-49](aws_client_vpc/assets/main_2021-07-25-14-00-49.png)

### サーバ証明書のACMへの登録

1. 一度もACMを使用したことがない場合、以下の画面が表示される。左側の「証明書のプロビジョニング」の下の「今すぐ始める」を選択する
    ![main_2021-07-25-14-03-34](aws_client_vpc/assets/main_2021-07-25-14-03-34.png)

1. 上の方に表示されている「証明書のインポート」を選択する
    ![main_2021-07-25-14-06-40](aws_client_vpc/assets/main_2021-07-25-14-06-40.png)

*※ACMを使用したことがある場合は、証明書の画面から「証明書のインポート」を選択する*
    ![main_2021-07-25-14-35-27](aws_client_vpc/assets/main_2021-07-25-14-35-27.png)

1. 以下の値を設定
    - 証明書本文
        - サーバ証明書ファイル（上記手順では`server.client-vpc-handson-20210725-sakainako.com.crt`）をテキストエディタで開き、中身をすべてコピーして貼り付ける
    - 証明書のプライベートキー
        - サーバ秘密鍵ファイル（上記手順では`server.client-vpc-handson-20210725-sakainako.com.key`）をテキストエディタで開き、中身をすべてコピーして貼り付ける
    - 証明書チェーン
        - CA証明書ファイル（上記手順では`ca.crt`）をテキストエディタで開き、中身をすべてコピーして貼り付ける

    ![main_2021-07-25-14-21-37](aws_client_vpc/assets/main_2021-07-25-14-21-37.png)

1. 「次へ」ボタンを選択する
    ![main_2021-07-25-14-25-35](aws_client_vpc/assets/main_2021-07-25-14-25-35.png)

1. タグは任意で設定し、「レビューとインポート」を選択する
    ![main_2021-07-25-14-27-25](aws_client_vpc/assets/main_2021-07-25-14-27-25.png)

1. 内容を確認し、「インポート」を選択する
    **「ドメイン」に値が入っていることを確認しておく。ドメインが「-」となっていた場合、後の手順（クライアントVPNエンドポイントの作成）にてエラーが発生した。**
    ![main_2021-07-25-15-53-47](aws_client_vpc/assets/main_2021-07-25-15-53-47.png)
    ![main_2021-07-25-14-30-19](aws_client_vpc/assets/main_2021-07-25-14-30-19.png)

1. サーバ証明書がACMに登録されたことを確認する
    ![main_2021-07-25-16-03-35](aws_client_vpc/assets/main_2021-07-25-16-03-35.png)

1. クライアントVPNエンドポイントの作成時に必要となるため、サーバ証明書のARNをメモしておく
    ![main_2021-07-25-16-05-36](aws_client_vpc/assets/main_2021-07-25-16-05-36.png)

### クライアント証明書のACMへの登録

- 本記事の手順で相互認証用の証明書を作成した場合、サーバ証明書とクライアント証明書の発行元認証機関（CA）が同じになる。この場合は、クライアント証明書のACMへの登録は**必要ない。** → [AWSドキュメント](https://docs.aws.amazon.com/ja_jp/vpn/latest/clientvpn-admin/client-authentication.html#mutual)に記載がある
- クライアント証明書の登録が必要な場合、手順はサーバ証明書と同じだが、以下の値を設定する
    - 証明書本文
        - クライアント証明書ファイル（上記手順では`client.client-vpc-handson-20210725-sakainako.com.crt`）をテキストエディタで開き、中身をすべてコピーして貼り付ける
    - 証明書のプライベートキー
        - クライアント秘密鍵ファイル（上記手順では`client.client-vpc-handson-20210725-sakainako.com.key`）をテキストエディタで開き、中身をすべてコピーして貼り付ける
    - 証明書チェーン
        - CA証明書ファイル（上記手順では`ca.crt`）をテキストエディタで開き、中身をすべてコピーして貼り付ける

## VPCとサブネットの作成

### VPCの作成

1. 「サービス」から「VPC」を選択する
    ![main_2021-07-25-11-00-26](aws_client_vpc/assets/main_2021-07-25-11-00-26.png)

1. 左のカラムから「VPC」を選択する
    ![main_2021-07-25-11-02-51](aws_client_vpc/assets/main_2021-07-25-11-02-51.png)

1. 「VPCを作成」ボタンを選択する
    ![main_2021-07-25-11-17-13](aws_client_vpc/assets/main_2021-07-25-11-17-13.png)

1. 以下の値を設定
    - 名前タグ：任意
    - IPv4 CIDR ブロック：172.16.0.0/16
    - 他はデフォルト
    ![main_2021-07-25-11-21-04](aws_client_vpc/assets/main_2021-07-25-11-21-04.png)

1. 「VPCを作成」ボタンを選択する
    ![main_2021-07-25-11-23-18](aws_client_vpc/assets/main_2021-07-25-11-23-18.png)

1. VPCが作成されたことを確認する
    ![main_2021-07-25-14-51-46](aws_client_vpc/assets/main_2021-07-25-14-51-46.png)

### サブネットの作成

1. 左のカラムから「サブネット」を選択する
    ![main_2021-07-25-11-25-50](aws_client_vpc/assets/main_2021-07-25-11-25-50.png)

1. 「サブネットを作成」ボタンを選択する
    ![main_2021-07-25-11-27-37](aws_client_vpc/assets/main_2021-07-25-11-27-37.png)

1. 以下の値を設定する
    - VPC
        - VPC ID：先程作成したVPC
    - サブネットの設定
        - サブネット名：任意
        - アベイラビリティーゾーン：任意
        - IPv4 CIDR ブロック：172.16.0.0/24
        - 他はデフォルト
    ![main_2021-07-25-11-34-06](aws_client_vpc/assets/main_2021-07-25-11-34-06.png)
    ![main_2021-07-25-11-34-27](aws_client_vpc/assets/main_2021-07-25-11-34-27.png)

1. 「サブネットを作成」ボタンを選択する
    ![main_2021-07-25-11-35-53](aws_client_vpc/assets/main_2021-07-25-11-35-53.png)

1. サブネットが作成されたことを確認する
    ![main_2021-07-25-14-52-55](aws_client_vpc/assets/main_2021-07-25-14-52-55.png)

## クライアントVPN エンドポイントの作成

1. 「クライアント VPN エンドポイント」を選択する
    ![main_2021-07-25-15-00-43](aws_client_vpc/assets/main_2021-07-25-15-00-43.png)

1. 「クライアント VPN エンドポイントの作成」ボタンを選択する
    ![main_2021-07-25-15-02-21](aws_client_vpc/assets/main_2021-07-25-15-02-21.png)

1. 以下の値を設定する
    - 名前タグ：任意
    - 説明：任意
    - クライアント IPv4 CIDR：10.0.0.0/16
    - サーバ証明書 ARN：サーバ証明書をACMに登録する時に控えておいた、サーバ証明書のARNを設定する
    - 認証オプション：相互認証の使用
    - クライアント証明書 ARN：本記事の手順の場合、サーバ証明書 ARNと同じ値を設定する
    - 接続ログ記録：「いいえ」を設定する
    - スプリットトンネルを有効にする：チェックをつける
    - 他はデフォルト
    ![main_2021-07-25-15-25-10](aws_client_vpc/assets/main_2021-07-25-15-25-10.png)
    ![main_2021-07-25-16-10-47](aws_client_vpc/assets/main_2021-07-25-16-10-47.png)

1. 「クライアント VPN エンドポイントの作成」ボタンを選択する
    ![main_2021-07-25-16-11-42](aws_client_vpc/assets/main_2021-07-25-16-11-42.png)

1. 作成に成功したら、以下の表示が出るので、「閉じる」ボタンを選択する
    ![main_2021-07-25-16-14-12](aws_client_vpc/assets/main_2021-07-25-16-14-12.png)

1. エンドポイントが作成されていることを確認する
    ![main_2021-07-25-16-15-46](aws_client_vpc/assets/main_2021-07-25-16-15-46.png)

## サブネットをクライアントVPN エンドポイントに関連付ける

1. 「関連付け」タブ → 「関連付け」ボタン の順に選択する
    ![main_2021-07-25-16-21-33](aws_client_vpc/assets/main_2021-07-25-16-21-33.png)

1. 上記手順で作成したVPCとサブネットを設定する
    ![main_2021-07-25-16-23-43](aws_client_vpc/assets/main_2021-07-25-16-23-43.png)

1. 「関連付け」ボタンを選択する
    ![main_2021-07-25-16-24-35](aws_client_vpc/assets/main_2021-07-25-16-24-35.png)

1. 作成に成功したら、以下の表示が出るので、「閉じる」ボタンを選択する
    ![main_2021-07-25-16-25-40](aws_client_vpc/assets/main_2021-07-25-16-25-40.png)

1. しばらく時間がかかるので、適宜更新ボタンで更新しつつ、待機する。状態が「使用可能」、「関連付け済み」となれば使用可能
    ![main_2021-07-25-16-32-48](aws_client_vpc/assets/main_2021-07-25-16-32-48.png)

## クライアントVPNエンドポイントに承認ルールを追加する

1. 「認証」タブ → 「受信の承認」ボタン の順に選択する
    ![main_2021-07-25-16-36-54](aws_client_vpc/assets/main_2021-07-25-16-36-54.png)

1. 以下の値を設定する
    - アクセスを有効にする送信先ネット：172.16.0.0/16  ※VPCのCIDR
    - アクセスを付与する対象：すべてのユーザーにアクセスを許可する
    - 説明：任意
    ![main_2021-07-25-16-42-15](aws_client_vpc/assets/main_2021-07-25-16-42-15.png)

1. 「認証ルールの追加」ボタンを選択する
    ![main_2021-07-25-16-43-07](aws_client_vpc/assets/main_2021-07-25-16-43-07.png)

1. 追加に成功したら、以下の表示が出るので、「閉じる」ボタンを選択する
    ![main_2021-07-25-16-44-05](aws_client_vpc/assets/main_2021-07-25-16-44-05.png)

## クライアント設定のダウンロード

1. 「クライアント設定のダウンロード」ボタンを選択する
    ![main_2021-07-25-16-52-59](aws_client_vpc/assets/main_2021-07-25-16-52-59.png)

1. 確認のウィンドウが表示されるので、「ダウンロード」ボタンを選択する
    ![main_2021-07-25-16-54-07](aws_client_vpc/assets/main_2021-07-25-16-54-07.png)

## ダウンロードしたクライアント設定の編集

1. ダウンロードしたクライアント設定ファイルをテキストエディタで開く

1. 以下の2行を追加する
    - `cert {クライアント証明書ファイルのパス}`
    - `key {クライアント秘密鍵ファイルのパス}`

    **※Windowsのパスに含まれる`\`（バックスラッシュ・円マーク）は`\\`としてエスケープする必要がある**

    - 編集例↓
    ![main_2021-07-25-17-40-31](aws_client_vpc/assets/main_2021-07-25-17-40-31.png)

1. クライアント設定ファイルを保存して閉じる

## OpenVPNクライアントで接続

1. OpenVPNクライアントを起動し、タスクトレイにあるアイコンを右クリック → 「Import file」を選択する
    ![main_2021-07-25-17-08-28](aws_client_vpc/assets/main_2021-07-25-17-08-28.png)

1. 上記で編集済のクライアント設定ファイルを選択し、「開く」ボタンを選択する
    ![main_2021-07-25-17-11-12](aws_client_vpc/assets/main_2021-07-25-17-11-12.png)

1. インポートに成功したら、以下のウィンドウが表示されるので、「OK」を選択する
    ![main_2021-07-25-17-12-33](aws_client_vpc/assets/main_2021-07-25-17-12-33.png)

1. タスクトレイにあるアイコンを右クリック → 「接続」を選択する
    ![main_2021-07-25-17-28-42](aws_client_vpc/assets/main_2021-07-25-17-28-42.png)

1. 接続に成功すると、以下の通知が出る
    ![main_2021-07-25-17-44-05](aws_client_vpc/assets/main_2021-07-25-17-44-05.png)

## EC2をプライベートサブネットに立てて、アクセスしてみる

### EC2インスタンスの起動

1. 「サービス」から「EC2」を選択する
    ![main_2021-07-25-17-47-32](aws_client_vpc/assets/main_2021-07-25-17-47-32.png)

1. 左のカラムから「インスタンス」を選択する
    ![main_2021-07-25-17-49-11](aws_client_vpc/assets/main_2021-07-25-17-49-11.png)

1. 「インスタンスを起動」ボタンを選択する
    ![main_2021-07-25-17-51-00](aws_client_vpc/assets/main_2021-07-25-17-51-00.png)

1. AMIは、Windows Server 2019 Base を選択
    ![main_2021-07-25-17-54-12](aws_client_vpc/assets/main_2021-07-25-17-54-12.png)

1. インスタンスタイプは、「t2.small」を選択し、「次のステップ：インスタンスの詳細の設定」ボタンを選択する
    ![main_2021-07-25-17-58-10](aws_client_vpc/assets/main_2021-07-25-17-58-10.png)

1. 以下の値を設定し、「次のステップ：ストレージの追加」ボタンを選択する
    - インスタンス数：1
    - ネットワーク：上記で作成したVPC
    - サブネット：上記で作成したサブネット
    - 他はデフォルト
    ![main_2021-07-25-18-02-10](aws_client_vpc/assets/main_2021-07-25-18-02-10.png)
    ![main_2021-07-25-18-03-40](aws_client_vpc/assets/main_2021-07-25-18-03-40.png)

1. 設定はデフォルトのままで、「次のステップ：タグの追加」ボタンを選択する
    ![main_2021-07-25-18-05-17](aws_client_vpc/assets/main_2021-07-25-18-05-17.png)

1. 設定はデフォルトのままで、「次のステップ：セキュリティグループの設定」ボタンを選択する
    ![main_2021-07-25-18-06-19](aws_client_vpc/assets/main_2021-07-25-18-06-19.png)

1. 以下の値を設定し、「確認と作成」ボタンを選択する
    - セキュリティグループの割り当て：既存のセキュリティグループを選択する
    - セキュリティグループID：VPCのデフォルトセキュリティグループ
    ![main_2021-07-25-18-10-13](aws_client_vpc/assets/main_2021-07-25-18-10-13.png)

1. 「起動」ボタンを選択する
    ![main_2021-07-25-18-12-23](aws_client_vpc/assets/main_2021-07-25-18-12-23.png)

1. 以下の値を設定し、「キーペアのダウンロード」ボタンを選択する
    - 新しいキーペアの作成 を選択
    - キーペア名：任意の名前
    ![main_2021-07-25-18-15-28](aws_client_vpc/assets/main_2021-07-25-18-15-28.png)

1. キーペアがダウンロードできたら、「インスタンスの作成」ボタンを選択する
    ![main_2021-07-25-18-19-48](aws_client_vpc/assets/main_2021-07-25-18-19-48.png)

1. インスタンスの作成中画面が出たら、「インスタンスの表示」ボタンを選択する
    ![main_2021-07-25-18-36-25](aws_client_vpc/assets/main_2021-07-25-18-36-25.png)

### EC2インスタンスへの接続

1. ステータスチェックが終わって起動したら、作成したインスタンスを選択して、「接続」を選択する
    ![main_2021-07-25-18-22-22](aws_client_vpc/assets/main_2021-07-25-18-22-22.png)

1. 「RDPクライアント」→「パスワードを取得」の順に選択する
    ![main_2021-07-25-18-37-52](aws_client_vpc/assets/main_2021-07-25-18-37-52.png)

1. 「Brouse」ボタンを選択する
    ![main_2021-07-25-18-26-11](aws_client_vpc/assets/main_2021-07-25-18-26-11.png)

1. 上記でダウンロードしたキーペアを選択し、「開く」ボタンを選択する
    ![main_2021-07-25-18-27-53](aws_client_vpc/assets/main_2021-07-25-18-27-53.png)

1. 「パスワードを復号化」ボタンを選択する
    ![main_2021-07-25-18-28-53](aws_client_vpc/assets/main_2021-07-25-18-28-53.png)

1. パスワードが表示されるので、コピーボタンを押してコピーしておく
    ![main_2021-07-25-18-33-50](aws_client_vpc/assets/main_2021-07-25-18-33-50.png)

1. Windowsキー + 「R」キーを押下して、「ファイル名を指定して実行」を表示させる

1. 「mstsc」と入力し、Enterキーを押下する
    ![main_2021-07-25-18-32-20](aws_client_vpc/assets/main_2021-07-25-18-32-20.png)

1. リモートデスクトップ接続のウィンドウが開くので、先程立ち上げたインスタンスのプライベートIPアドレスを入力し、「接続」を選択する
    ![main_2021-07-25-18-41-24](aws_client_vpc/assets/main_2021-07-25-18-41-24.png)

1. ユーザー名に「Administrator」、パスワードに、上記でコピーしたパスワードを入力し、「OK」を選択する
    ![main_2021-07-25-18-45-36](aws_client_vpc/assets/main_2021-07-25-18-45-36.png)

1. 警告のウィンドウが出るが、気にせず「はい」を選択する
    ![main_2021-07-25-18-46-53](aws_client_vpc/assets/main_2021-07-25-18-46-53.png)

1. 接続できました！
    ![main_2021-07-25-18-49-26](aws_client_vpc/assets/main_2021-07-25-18-49-26.png)

VPNを切断すると・・・
    ![main_2021-07-25-18-54-04](aws_client_vpc/assets/main_2021-07-25-18-54-04.png)

もちろん接続が切れます！
    ![main_2021-07-25-18-54-53](aws_client_vpc/assets/main_2021-07-25-18-54-53.png)

# お片付け

## EC2インスタンスの終了

1. AWSコンソールのEC2 → インスタンスから、今回作成したインスタンスを選択し、「インスタンスの状態」 → 「インスタンスを終了」を選択する
    ![main_2021-07-25-18-58-49](aws_client_vpc/assets/main_2021-07-25-18-58-49.png)

1. 終了確認のウィンドウにて、「終了」を選択する
    ![main_2021-07-25-19-00-05](aws_client_vpc/assets/main_2021-07-25-19-00-05.png)

## キーペアの削除

1. AWSコンソールのEC2 → キーペアから、今回作成したキーペアを選択し、「アクション」 → 「削除」を選択する
    ![main_2021-07-25-19-04-21](aws_client_vpc/assets/main_2021-07-25-19-04-21.png)

1. 削除確認のウィンドウにて、「削除」と入力し、「削除」ボタンを選択する
    ![main_2021-07-25-19-05-49](aws_client_vpc/assets/main_2021-07-25-19-05-49.png)

## クライアントVPNエンドポイントの関連付けの解除

1. AWSコンソールのVPC → クライアントVPNエンドポイントから、今回作成したクライアントVPNエンドポイントを選択し、「関連付け」タブ → 「関連付けの解除」ボタンを選択する
    ![main_2021-07-25-19-18-52](aws_client_vpc/assets/main_2021-07-25-19-18-52.png)

1. 解除確認のウィンドウにて、「はい、関連付けを解除する」ボタンを選択する
    ![main_2021-07-25-19-19-54](aws_client_vpc/assets/main_2021-07-25-19-19-54.png)

1. しばらく時間がかかるので、適宜更新ボタンで更新しつつ、待機する。関連付けが消えれば完了
    ![main_2021-07-25-19-30-04](aws_client_vpc/assets/main_2021-07-25-19-30-04.png)

## クライアントVPNエンドポイントの削除

1. AWSコンソールのVPC → クライアントVPNエンドポイントから、今回作成したクライアントVPNエンドポイントを選択し、「関連付け」タブ → 「関連付けの解除」ボタンを選択する
    ![main_2021-07-25-19-42-03](aws_client_vpc/assets/main_2021-07-25-19-42-03.png)

1. 削除確認のウィンドウにて、「はい、削除する」を選択する
    ![main_2021-07-25-19-43-47](aws_client_vpc/assets/main_2021-07-25-19-43-47.png)

1. クライアントVPNエンドポイントが消えれば、削除完了
    ![main_2021-07-25-19-44-34](aws_client_vpc/assets/main_2021-07-25-19-44-34.png)

## VPCの削除

1. AWSコンソールのVPCから、今回作成したVPCを選択し、「アクション」 → 「VPCの削除」を選択する
    ![main_2021-07-25-19-14-54](aws_client_vpc/assets/main_2021-07-25-19-14-54.png)

1. 削除確認のウィンドウにて、「削除」と入力し、「削除」ボタンを選択する
    ![main_2021-07-25-19-32-16](aws_client_vpc/assets/main_2021-07-25-19-32-16.png)

1. VPCが消えれば、削除完了
    ![main_2021-07-25-19-33-30](aws_client_vpc/assets/main_2021-07-25-19-33-30.png)

## ACMから相互認証用の証明書を削除

1. AWSコンソールのACMから、今回作成した証明書を選択し、「アクション」 → 「削除」を選択する
    ![main_2021-07-25-19-38-24](aws_client_vpc/assets/main_2021-07-25-19-38-24.png)

1. 削除確認のウィンドウにて、「削除」ボタンを選択する
    ![main_2021-07-25-19-45-58](aws_client_vpc/assets/main_2021-07-25-19-45-58.png)

## OpenVPNクライアントの終了とアンインストール

1. タスクトレイにあるアイコンを右クリックし、「終了」を選択する
    ![main_2021-07-25-19-50-54](aws_client_vpc/assets/main_2021-07-25-19-50-54.png)

1. Windowsキー + 「R」キーを押下して、「ファイル名を指定して実行」を表示させる

1. 「appwiz.cpl」と入力し、Enterキーを押下する
    ![main_2021-07-25-12-21-52](aws_client_vpc/assets/main_2021-07-25-12-21-52.png)

1. 「OpenVPN」 → 「アンインストール」の順に選択する
    ![main_2021-07-25-19-54-09](aws_client_vpc/assets/main_2021-07-25-19-54-09.png)

1. 確認のウィンドウが表示された場合、「はい」を選択する
    ![main_2021-07-25-19-55-50](aws_client_vpc/assets/main_2021-07-25-19-55-50.png)
※ユーザーアカウント制御のダイアログが出たら、「はい」を選択する

1. `C:\Users\ユーザー名`のフォルダにある「OpenVPN」フォルダを削除する
    ![main_2021-07-25-20-02-39](aws_client_vpc/assets/main_2021-07-25-20-02-39.png)

## vpnux PKI Managerの終了とファイル削除

1. vpnux PKI Managerのメニューから、「ファイル」 → 「終了」を選択する
    ![main_2021-07-25-19-58-48](aws_client_vpc/assets/main_2021-07-25-19-58-48.png)

1. 証明書作成の際に作ったフォルダを削除する
    ![main_2021-07-25-20-06-11](aws_client_vpc/assets/main_2021-07-25-20-06-11.png)

1. ダウンロードして解凍したvpnux PKI Managerのフォルダを削除する
    ![main_2021-07-25-20-07-45](aws_client_vpc/assets/main_2021-07-25-20-07-45.png)

# 参考にしたサイト

- AWSのドキュメント
    - [AWS Client VPN 管理者ガイド](https://docs.aws.amazon.com/ja_jp/vpn/latest/clientvpn-admin/index.html)
    - [AWS Client VPN ユーザーガイド](https://docs.aws.amazon.com/ja_jp/vpn/latest/clientvpn-user/index.html)

- おなじみDevolopersIOさん（下記の他にも大量の情報が・・・お世話になってます）
    - [[AWS]踏み台をワンチャンなくせる！？VPC接続にClient VPNを使ってみよう](https://dev.classmethod.jp/articles/vpc-client-vpn/)
    - [Client VPN の証明書を Windows で作成してみた (vpnux PKI Manager 編)](https://dev.classmethod.jp/articles/generate-certificates-with-vpnux-pki-manager/)
    - [AWS Client VPN のリソースとパラメータを一枚絵にまとめつつ過去のエントリもまとめてみた](https://dev.classmethod.jp/articles/aws-client-vpn-perfect-understand-2/)
    - [AWS Client VPN のコンポーネントを絵に描いて理解しつつ NetworkACL や SecuriryGroup をどこまで絞れるのか試してみた](https://dev.classmethod.jp/articles/aws-client-vpn-perfect-understand/)
