import io
import os
import re
from google.cloud import texttospeech
from pydub import AudioSegment

# 🔴 ここに10個の例文をそのまま貼り付けてください
RAW_TEXT = """
1

Unfortunately, the newspaper editor wrote a memo stating that the rent for the original branch in good condition will increase after the art exhibition, which includes traffic updates for those carrying luggage during their paid leave.

Unfortunately, the newspaper editor wrote a memo stating that the rent for the original branch in good condition will increase after the art exhibition, which includes traffic updates for those carrying luggage during their paid leave.

不運にも、新聞編集者が、良好な状態にある元の支店の賃料が上がることや、有給休暇中に手荷物を運ぶ人のための交通情報の更新を含むメモを書きました。

2

As a leading organization, we focus on employee benefits and will release a new album for a limited time following the normal procedure for experienced personnel and the book's author.

As a leading organization, we focus on employee benefits and will release a new album for a limited time following the normal procedure for experienced personnel and the book's author.

一流の組織として、私たちは従業員の福利厚生に重点を置いており、熟練した職員や本の著者のための通常の手続きに従って、期間限定で新しいアルバムをリリースする予定です。

3

To participate in the workshop, an expert in journalism who works mainly as a television show host impressed us by purchasing materials directly to identify the cause of the problem and complete his degree.

To participate in the workshop, an expert in journalism who works mainly as a television show host impressed us by purchasing materials directly to identify the cause of the problem and complete his degree.

ワークショップに参加するため、主にテレビ番組の司会者として活動するジャーナリズムの専門家は、問題の原因を特定し学位を修了するために、直接資料を購入して私たちを感銘させました。

4

The sales representative reminded workers in the steel industry that the company policy requires them to wear uniforms and submit every suggestion and important document to the supplier.

The sales representative reminded workers in the steel industry that the company policy requires them to wear uniforms and submit every suggestion and important document to the supplier.

販売担当者は、鉄鋼業界の従業員に対し、会社の規定で制服の着用が義務付けられていること、そしてあらゆる提案や重要な書類を仕入れ先に提出することを再確認させました。

5

Please inquire at extension 4649 for a job description as the property manager of our highly successful business, which resulted in a massive display of merchandise in the packaging area.

Please inquire at extension 4649 for a job description as the property manager of our highly successful business, which resulted in a massive display of merchandise in the packaging area.

当社の非常に成功している事業の物件管理者としての職務内容については、内線4649までお問い合わせください。その結果、梱包エリアには大量の商品が陳列されました。

6

Each individual at the headquarters is encouraged to consider providing assistance when we ship the medical device intended for commercial buildings from the laboratory.

Each individual at the headquarters is encouraged to consider providing assistance when we ship the medical device intended for commercial buildings from the laboratory.

本社の各個人は、研究所から商業ビル向けの医療機器を出荷する際、支援を提供することを検討するよう奨励されています。

7

In response to the scientific journal, companies in the region prefer to mail a product brochure to increase donations and reach a rental agreement by the third quarter.

In response to the scientific journal, companies in the region prefer to mail a product brochure to increase donations and reach a rental agreement by the third quarter.

科学雑誌への回答として、この地域の企業は寄付を増やし、第3四半期までに賃貸契約に達するために、製品パンフレットを郵送することを好みます。

8

The city council advised potential customers to immediately reschedule their appointment at the warehouse to renew their agreement and distribute a document regarding the full refund.

The city council advised potential customers to immediately reschedule their appointment at the warehouse to renew their agreement and distribute a document regarding the full refund.

市議会は、潜在的な顧客に対し、倉庫での予約を直ちに再調整して契約を更新し、全額返金に関する書類を配布するよう助言しました。

9

The car manufacturer is responsible for an effective advertising campaign broadcast on Saturdays to reduce vehicle prices, avoid wasting time, and ensure the entire staff uses the correct and efficient methods in comfortable rooms.

The car manufacturer is responsible for an effective advertising campaign broadcast on Saturdays to reduce vehicle prices, avoid wasting time, and ensure the entire staff uses the correct and efficient methods in comfortable rooms.

その自動車メーカーは、土曜日に放送される効果的な広告キャンペーンに責任を持っており、車両価格を下げ、時間の浪費を避け、全スタッフが快適な部屋で正しく効率的な方法を使用することを確実にします。

10

We apologize for the delay regarding your shipment status and fuel costs; meanwhile, admission is free for a wide range of services in a beautiful setting where temporary workers determine how to fit traditional dishes into the cafeteria nearly two years after their promotion to the downtown branch, following a frequent reference to payment methods and an invitation to the event.

We apologize for the delay regarding your shipment status and fuel costs; meanwhile, admission is free for a wide range of services in a beautiful setting where temporary workers determine how to fit traditional dishes into the cafeteria nearly two years after their promotion to the downtown branch, following a frequent reference to payment methods and an invitation to the event.

配送状況や燃料費に関する遅延をお詫び申し上げます。一方で、美しい環境での幅広いサービスへの入場は無料であり、そこでは臨時従業員が、支払方法への頻繁な参照やイベントへの招待を経て、ダウンタウン支店への昇進から約2年後に、カフェテリアに伝統料理をどのように収めるかを決定します。
"""

def is_english(text):
    """文字列が英語（アルファベット主体）かどうかを判定する関数"""
    # 記号や数字を除いた上で、アルファベットの割合が多いかチェック
    clean_text = re.sub(re.compile(r'[0-9\s.,\-\"\':;?!()\x00-\x7F]'), '', text)
    # 残った文字がなければ（数字や英語のみだった場合）、英語と判定
    return len(clean_text) == 0

def synthesize_line(client, text, is_eng):
    """1行分の音声を生成してAudioSegmentオブジェクトで返す関数"""
    synthesis_input = texttospeech.SynthesisInput(text=text)

    # 英語と日本語で声と言語を切り替える
    if is_eng:
        voice = texttospeech.VoiceSelectionParams(
            language_code="en-US", name="en-US-Neural2-F"  # 英語（女性声）
        )
    else:
        voice = texttospeech.VoiceSelectionParams(
            language_code="ja-JP", name="ja-JP-Neural2-B"  # 日本語（女性声）
        )

    audio_config = texttospeech.AudioConfig(
        audio_encoding=texttospeech.AudioEncoding.LINEAR16,
        speaking_rate=1.0
    )

    response = client.synthesize_speech(
        input=synthesis_input, voice=voice, audio_config=audio_config
    )
    
    # バイナリデータをpydubで扱える形式に変換
    return AudioSegment.from_file(io.BytesIO(response.audio_content), format="wav")

def main():
    client = texttospeech.TextToSpeechClient()
    combined_audio = AudioSegment.empty()
    
    # 1秒の無音（文章の間のウェイト用）
    silence = AudioSegment.silent(duration=1000) 

    # テキストを1行ずつ処理
    lines = RAW_TEXT.strip().split("\n")
    
    for i, line in enumerate(lines):
        line = line.strip()
        if not line:
            continue  # 空行はスキップ
            
        print(f"処理中 ({i+1}/{len(lines)}): {line[:20]}...")
        
        # 英語か日本語かを自動判定
        is_eng = is_english(line)
        
        # 1行分の音声を生成
        line_audio = synthesize_line(client, line, is_eng)
        
        # 全体の音声に結合（最後に少し無音を挟む）
        combined_audio += line_audio + silence

    # 最終的な1つのファイルとして書き出し
    output_filename = "2_101-200.wav"
    combined_audio.export(output_filename, format="wav")
    print(f"\n✨ すべての処理が完了しました！『{output_filename}』を確認してください。")

if __name__ == "__main__":
    main()