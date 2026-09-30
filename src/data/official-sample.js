/* Offizieller EPSO-Beispieltest „Reasoning tests AD“ (deutsche Fassung, TAO-Plattform) – 20 Aufgaben.
   Quelle: https://eu-careers.europa.eu/en/graduates-administrators-ad5 → Sample test DE,
   Lösungen aus der Auswertungsansicht des Beispieltests und den barrierefreien PDF-Fassungen
   (AD_Verbal_10Q_DA2.pdf, AD_Numerical_5Q_DA2.pdf). Abgerufen am 30.09.2026.
   Texte und Antwortoptionen sind wörtlich übernommen. Die Tabellen sind als HTML nachgesetzt,
   die Figurenreihen des abstrakten Teils als SVG nachgezeichnet. Erklärungen sind eigene Ergänzungen. */
(function (root) {
  'use strict';
  const SRC = 'EPSO-Beispieltest';
  const STEM_V = 'Welche der folgenden Aussagen ist zutreffend?';

  // ---------- Sprachlogisches Denken ----------
  const V = [
    ['Gentests',
      'Gentests sind medizinische Verfahren, mit denen Veränderungen oder bestimmte Probleme an Genen und Chromosomen festgestellt werden können. Meistens dienen Gentests dazu, Erbkrankheiten wie die Bluterkrankheit zu erkennen. Durch Gentests kann bei Verdacht eine Krankheit nachgewiesen oder ausgeschlossen werden und kann die Wahrscheinlichkeit festgestellt werden, dass ein Mensch an einer Erbkrankheit erkrankt oder diese vererbt. Derzeit werden mehrere Hundert Gentests verwendet; weitere werden entwickelt. Da die Tests einerseits Vorteile bieten und andererseits problematisch sind, ist die Entscheidung, ob man sich testen lassen möchte, jedem selbst überlassen. Es gibt Berater, die über die Tests informieren und bei der Entscheidung helfen, aber viele Menschen bezweifeln noch immer die Nützlichkeit der Gentests. Sie glauben, dass mit Gentests nur die Vererbung tödlicher Krankheiten nachgewiesen wird, und ziehen es daher vor, nichts darüber zu erfahren.',
      ['Im Allgemeinen werden gesunde Menschen Gentests unterzogen',
        'Mit Gentests kann festgestellt werden, wie groß die Wahrscheinlichkeit ist, dass jemand an einer bestimmten Krankheit erkrankt',
        'Gentests sind nicht sehr sinnvoll, weil sie freiwillig sind',
        'Jährlich werden mehrere Hundert Gentests durchgeführt'],
      1,
      'B steht fast wörtlich im Text („kann die Wahrscheinlichkeit festgestellt werden, dass ein Mensch an einer Erbkrankheit erkrankt“). A: Der Text sagt nur, wofür Gentests meist dienen, nicht, wer sie im Allgemeinen macht. C verknüpft zwei Aussagen zu einer Begründung, die der Text nicht zieht; Zweifel äußern nur „viele Menschen“. D verwechselt „mehrere Hundert Gentests verwendet“ (Arten von Tests) mit der Zahl der jährlich durchgeführten Tests.'],
    ['Antarktis',
      'Die Antarktis ist bei weitem der kälteste Kontinent - dort werden weltweit die niedrigsten Temperaturen gemessen. Ihre gewaltige Eisdecke umfasst 90 % des gesamten Gletschereises der Welt. Aufgrund des rauen Klimas gibt es in der Antarktis nur sehr wenige Pflanzen, doch das Meer bietet ein reichhaltiges Nahrungsangebot für Pinguine und große Seevogelkolonien. Der Russe F.G. von Bellingshausen zählte zur Gruppe der Forscher, die nach eignen Aussagen 1820 als erste den Kontinent erblickten. Doch erst Anfang des 20. Jahrhunderts erforschten Expeditionen zahlreicher Länder das Innere der Antarktis. Dies hatte zur Folge, dass sieben Nationen auf diesem Kontinent Gebietsansprüche erhoben, obwohl sie diese Gebiete nie dauerhaft besiedelten. 1958 errichteten zwölf Nationen im Rahmen einer gemeinsamen Studie Forschungsstationen in der Antarktis.',
      ['Der erste Mensch, der die Antarktis erblickte, war ein Russe',
        'Anfang des 20. Jahrhunderts erhoben sieben Länder Gebietsansprüche in der Antarktis, 1958 stieg diese Zahl auf zwölf an',
        'In der Antarktis befindet sich mehr Gletschereis als auf allen anderen Kontinenten zusammen',
        'In der Antarktis gab es nie dauerhaft menschliche Bewohner'],
      2,
      'C folgt rechnerisch: 90 % des Gletschereises liegen in der Antarktis, für alle anderen Kontinente bleiben 10 %. A: Bellingshausen gehörte nur zu einer Gruppe, die „nach eigenen Aussagen“ als erste den Kontinent sah – das ist kein belegter Erstkontakt. B: 1958 errichteten zwölf Nationen Forschungsstationen, das sind keine Gebietsansprüche. D: Der Text sagt nur, dass die sieben Nationen ihre Gebiete nicht dauerhaft besiedelten, nicht dass es nie Bewohner gab.'],
    ['Moldau',
      'Moldau ist eine Region im Nordosten Rumäniens. Bis zu ihrer Vereinigung mit der Walachei im Jahr 1859 war Moldau ein unabhängiger Staat. Heute bildet sie einen großen Teil des modernen rumänischen Staates. In der Geschichte gehörten wiederholt die Regionen Bessarabien und Bukowina zu Moldau. Ein Großteil Bessarabiens bildet heute die Republik Moldau, während der Rest Bessarabiens und der Norden Bukowinas zur Ukraine gehören.',
      ['Das Gebiet der historischen Moldau ist heute auf mindestens drei Staaten verteilt',
        'Der Staat Moldau war bis 1859 Teil der Region Moldau',
        'Die Region Moldau erstreckt sich auf dasselbe Gebiet wie der unabhängige Staat Moldau',
        'Bessarabien und Bukowina bilden heute die Republik Moldau bzw. die Ukraine'],
      0,
      'A ist richtig: Teile der historischen Moldau liegen heute in Rumänien, in der Republik Moldau (Großteil Bessarabiens) und in der Ukraine (Rest Bessarabiens, Nord-Bukowina). B vermischt die Begriffe: Bis 1859 war Moldau selbst ein unabhängiger Staat. C: Die heutige Republik Moldau umfasst nur einen Großteil Bessarabiens. D ist zu pauschal: Nur ein Teil Bessarabiens ist heute Moldau, und nur der Norden der Bukowina gehört zur Ukraine.'],
    ['Gambel-Eiche',
      'Die Gambel-Eiche ist ein kleiner Laub abwerfender Baum, der gewöhnlich in einer Höhe zwischen 1700 und 2400 m über dem Meeresspiegel wächst. Er ist im Vorgebirge des mittleren Südwestens der Vereinigten Staaten sehr verbreitet und wächst vor allem dort, wo der Niederschlag 30 – 60 cm im Jahr beträgt. Gambel-Eichen gedeihen an Hängen mit dünnem, steinigem, alkalischem Erdboden, wo andere Pflanzen nur begrenzt wachsen. Sie können auch in fruchtbarerem Boden überleben, sind dort aber größerer Konkurrenz durch andere Pflanzen ausgesetzt. Gambel-Eichen haben sich auf nasse Frühlings- und heiße, trockene Sommerzeiten eingestellt – Bedingungen, die auch Brände begünstigen. Doch selbst wenn sie schwer verbrannt ist, kann sich die Gambel-Eiche schnell aus ihren unterirdischen Wurzeln regenerieren und Dürre widerstehen.',
      ['Gambel-Eichen gedeihen an Hängen, an denen keine anderen Pflanzen überleben können',
        'Gambel-Eichen sind in den ganzen Vereinigten Staaten verbreitet',
        'Gambel-Eichen gedeihen besser in einer Umgebung, in der sie weniger Konkurrenz durch andere Pflanzen ausgesetzt sind',
        'Die Gambel-Eiche kann nicht durch Feuer oder Dürre zerstört werden'],
      2,
      'C ergibt sich aus dem Gegensatz im Text: Sie „gedeihen“ dort, wo andere Pflanzen nur begrenzt wachsen, auf fruchtbarem Boden „überleben“ sie nur und haben mehr Konkurrenz. A übertreibt („keine anderen Pflanzen“ statt „nur begrenzt“). B: Verbreitet ist sie im mittleren Südwesten, nicht in den ganzen USA. D übertreibt: Sie regeneriert sich nach Bränden und widersteht Dürre, unzerstörbar ist sie deshalb nicht.'],
    ['Haiku',
      'Haiku sind eine Form der japanischen Dichtung, die keine Reime kennt. Haiku bestehen aus 17 Silben, die entweder eine einzige Zeile oder drei Zeilen mit jeweils fünf, sieben und fünf Silben füllen. Das Gedicht enthält stets einen Hinweis auf die Jahreszeit, die den Rahmen bildet. Haiku-Dichter drücken möglichst viel mit möglichst wenigen Worten aus. Diese Form der Dichtung wurde durch den Dichter Basho im 17. Jahrhundert bekannt gemacht, der sie kunstvoll verfeinerte. In Japan sind Haiku auch heute noch die beliebteste Form der Dichtung.',
      ['Haiku nutzen subtile Reime, um die Bedeutung des Gedichts zum Ausdruck zu bringen',
        'In längeren Haiku-Gedichten wird oft die Struktur von fünf, sieben und fünf Silben in sechs-, neun- oder zwölfzeiligen Versen wiederholt',
        'Haiku enthalten in der Regel drei Wörter mit fünf, sieben bzw. fünf Silben',
        'Haiku enthalten immer einen Hinweis auf die Jahreszeit, die den Rahmen bildet'],
      3,
      'D gibt „enthält stets einen Hinweis auf die Jahreszeit“ wieder. A widerspricht „keine Reime“. B: Laut Text bestehen Haiku immer aus 17 Silben, längere Haiku gibt es danach nicht. C verwechselt Zeilen mit Wörtern.'],
    ['Posttraumatische Belastungsstörung',
      'Ein gängiges Blutdruckmittel könnte Menschen, die ein traumatisches Erlebnis hatten, helfen, sich von ihren quälenden Erinnerungen zu befreien. Ein Drittel der Personen, die ein belastendes Erlebnis hatten, leiden unter posttraumatischen Belastungsstörungen. Schon ein Geräusch oder ein Geruch kann die Erinnerung an dieses Erlebnis wieder wachrufen. Patienten mit dieser Störung erhalten eine Beratung. Da diese jedoch nicht immer wirksam ist, suchen Forscher nach alternativen Therapien. Studien haben gezeigt, dass Ratten, die konditioniert waren, auf bestimmte Ereignisse im Labor mit Angst zu reagieren, nach Verabreichung des Medikaments ihre Angst verloren. Dies deutet darauf hin, dass das Medikament zur Behandlung posttraumatischer Belastungsstörungen beitragen könnte. Für einige Kritiker sind posttraumatische Belastungsstörungen jedoch eine natürliche Reaktion auf traumatische Erlebnisse und sollten daher nicht medikamentös behandelt werden.',
      ['Posttraumatische Belastungsstörungen hängen mit zu hohem Blutdruck zusammen',
        'Es ist unwahrscheinlich, dass Patienten, die unter posttraumatischen Belastungsstörungen leiden, sich von alleine erholen',
        'Geräusche oder Gerüche können Erinnerungen an belastende Erlebnisse wachrufen',
        'Bei der Behandlung posttraumatischer Belastungsstörungen ist die Beratung in der Regel unwirksam'],
      2,
      'C steht so im Text. A ist ein Fehlschluss: Dass ein Blutdruckmittel helfen könnte, heißt nicht, dass die Störung mit Blutdruck zusammenhängt. B: Über Spontanheilung sagt der Text nichts. D übertreibt: Die Beratung ist „nicht immer wirksam“, nicht „in der Regel unwirksam“.'],
    ['Methode der kleinsten Quadrate',
      'Die Methode der kleinsten Quadrate ist eine statistische Methode zur Berechnung einer Geraden oder einer Kurve, die das Verhältnis zwischen zwei Messgrößen am besten repräsentiert. Werden die Messungen als Punkte auf einen Graphen übertragen und liegen sie nahe an derselben Linie, so kann zur Bestimmung der Modellkurve die Methode der kleinsten Quadrate angewandt werden. Die Parameter dieser Kurve werden numerisch bestimmt, indem die Summe der quadratischen Abweichungen der Kurve von den beobachteten Punkten minimiert wird. Man spricht von Regression oder, wenn die Linie eine Gerade und keine Kurve ist, von linearer Regression.',
      ['Die Methode der kleinsten Quadrate wird in der Praxis kaum angewandt',
        'Die lineare Regression ist eine Methode, die den Abstand von Datenpunkten zu einer Horizontalen berechnet',
        'Die Methode der kleinsten Quadrate ermöglicht das Anlegen einer Modellkurve, die die Datenpunkte für zwei Messgrößen am besten repräsentiert',
        'Die Methode der kleinsten Quadrate funktioniert am besten bei Kurven'],
      2,
      'C fasst den ersten und zweiten Satz zusammen. A: Über die Verbreitung in der Praxis sagt der Text nichts. B: Gemessen werden die Abweichungen von der Modellgeraden, nicht von einer Horizontalen. D: Der Text vergleicht Geraden und Kurven nicht.'],
    ['Europäische Weltwirtschaft im 19. Jahrhundert',
      'Die Herausbildung der auf Europa ausgerichteten Weltwirtschaft im 19. Jahrhundert war geprägt durch ein System von Nationalstaaten, die zueinander in Wettbewerb standen. Ein wesentliches Merkmal dieser Epoche war, dass kein Staat allein stark genug war, um die anderen zu beherrschen. Aus dieser Lage heraus entstand die Weltwirtschaft. Im Gegensatz zu früheren Systemen wie beispielsweise dem Reich der Habsburger, in dem die Stabilität der Wirtschaft von der Stabilität des Reiches abhing, konnte in diesem neuen Weltsystem die Wirtschaft auch dann fortbestehen, wenn ein Staat oder eine Regierung zusammenbrach. Es spielte keine Rolle mehr, welche Staaten beteiligt waren; die Wirtschaftstätigkeit konnte wegen des Wettbewerbs zwischen den verschiedenen Ländern und politischen Gruppierungen fortgesetzt werden.',
      ['Das Habsburgerreich brach aufgrund wirtschaftlicher Instabilität zusammen',
        'Durch den Wettbewerb wurde die Wirtschaft des neuen Weltsystems stabiler',
        'Die auf Europa ausgerichtete Weltwirtschaft war das Ergebnis des Handelns eines dominanten Staates',
        'Der Zusammenbruch eines Nationalstaats hätte die auf Europa ausgerichtete Weltwirtschaft erheblich geschwächt'],
      1,
      'B ergibt sich aus dem letzten Satz: Wegen des Wettbewerbs lief die Wirtschaft auch weiter, wenn ein Staat zusammenbrach. A dreht die Abhängigkeit um: Die Wirtschaft hing von der Stabilität des Reiches ab, nicht umgekehrt; zum Zusammenbruch sagt der Text nichts. C widerspricht „kein Staat allein stark genug“. D widerspricht der Aussage, dass die Wirtschaft den Zusammenbruch eines Staates überstand.'],
    ['Lemuren',
      'Lemuren sind eine Familie aus der Ordnung der Primaten und werden der Unterordnung der Halbaffen (richtiger: Feuchtnasenaffen) zugerechnet. Man nimmt an, dass sie ursprünglich in Afrika verbreitet waren, heute sind sie jedoch nur noch auf der Insel Madagaskar und einigen kleineren umliegenden Inseln anzutreffen, einschließlich der Komoren (wohin sie wahrscheinlich von den Menschen gebracht wurden). Ihr Körpergewicht reicht je nach Art vom 30 g schweren Zwerg-Mausmaki bis zum 10 kg schweren Indri. Früher gab es auf Madagaskar sogar noch größere Arten, die aber seit der Ansiedlung der Menschen ausgestorben sind. Die kleineren Lemurenarten sind meist nachtaktiv und die größeren tagaktiv, es gibt aber auch Ausnahmen.',
      ['Lemuren lebten schon auf Madagaskar, bevor die Insel von Menschen besiedelt wurde',
        'Lemuren kommen von Natur aus auf den Komoren vor',
        'Indris sind nur tagsüber aktiv',
        'Das Aussterben der größten Lemurenarten ist eine unmittelbare Folge der Ansiedlung der Menschen auf Madagascar'],
      0,
      'A folgt aus dem Text: Größere Arten sind „seit der Ansiedlung der Menschen“ ausgestorben – sie müssen also vorher schon auf Madagaskar gelebt haben. B widerspricht der Klammer (wahrscheinlich von Menschen gebracht). C: Größere Arten sind meist tagaktiv, es gibt aber Ausnahmen; über Indris im Besonderen sagt der Text nichts Sicheres. D: „seit“ beschreibt nur die zeitliche Abfolge, keine Ursache.'],
    ['Programm Marco Polo',
      'Hauptziele des Programms Marco Polo sind die Verringerung der Überlastung der Straßen und die Verbesserung der Umweltfreundlichkeit des gesamten Verkehrssystems. Das Programm soll einen verkehrspolitischen Kurs unterstützen, der im Weißbuch der Kommission "Die europäische Verkehrspolitik bis 2010 - Weichenstellungen für die Zukunft" dargelegt wurde. Dort wird empfohlen, die Verkehrsträgeranteile im Güterverkehr bis 2010 wieder auf die Höhe von 1998 zurückzuführen. Um dies zu erreichen, werden mit dem Programm Aktionen in den Sektoren Güterverkehr und Logistik sowie anderen Bereichen unterstützt. Die Aktionen sollen beispielsweise dazu beitragen, den Straßengüterverkehr auf den Kurzstreckenseeverkehr, die Schiene und die Binnenschifffahrt zu verlagern und den Güterverkehr per Straße auf das Minimum zu reduzieren.',
      ['Die Verlagerung des Straßengüterverkehrs auf den Kurzstreckenseeverkehr, die Schiene und die Binnenschifffahrt soll sich positiv auf die Umwelt auswirken',
        'Das Programm wurde eingeführt, weil der internationale Straßengüterverkehr erheblich zugenommen hat',
        'Im Weißbuch der Kommission stehen die Auswirkungen des Güterverkehrs auf die Umwelt im Vordergrund, nicht die Überlastung der Straßen',
        'Der Gütertransport im Kurzstreckenseeverkehr, auf der Schiene und in der Binnenschifffahrt ist seit 1998 insgesamt zurückgegangen'],
      0,
      'A verbindet Ziel und Mittel des Programms: Die Verlagerung dient den Hauptzielen, zu denen die Umweltfreundlichkeit des Verkehrssystems gehört. B: Einen Anstieg des internationalen Straßengüterverkehrs erwähnt der Text nicht. C: Der Text gewichtet die Ziele im Weißbuch nicht. D: Der Text spricht von Verkehrsträgeranteilen, nicht vom absoluten Transportvolumen.'],
  ];

  // ---------- Zahlenverständnis ----------
  const FUE = '<div class="data-wrap"><table class="data official"><caption>FuE-Ausgaben nach Ländern</caption><thead>' +
    '<tr><th class="rowhead" rowspan="2">Land</th><th colspan="2">FuE-Ausgaben<br>(in % des BIP)</th><th colspan="2">Öffentliche FuE-Ausgaben<br>(in % der FuE-Ausgaben)</th><th>Zahl der Patent&shy;anmeldungen<br>(pro Mio. Einwohner)</th><th>FuE-Ausgaben<br>(in Mio. €)</th><th>BIP pro Kopf<br>(in €)</th></tr>' +
    '<tr><th>2000</th><th>2003</th><th>2000</th><th>2003</th><th>2000</th><th>2000</th><th>2000</th></tr></thead><tbody>' +
    [['Belgien', '1,97', '1,89', '22,9', '23,5', '145,6', '3 900', '19 330'],
      ['Finnland', '3,34', '3,43', '26,2', '25,7', '350,8', '3 725', '21 582'],
      ['Frankreich', '2,15', '2,17', '38,7', '39,0', '139,5', '24 075', '18 874'],
      ['Deutschland', '2,45', '2,52', '31,4', '31,2', '307,0', '41 100', '20 261'],
      ['Niederlande', '1,82', '1,76', '34,2', '36,2', '246,3', '6 075', '21 003']]
      .map((r) => '<tr><th class="rowhead" scope="row">' + r[0] + '</th>' + r.slice(1).map((c) => '<td>' + c + '</td>').join('') + '</tr>').join('') +
    '</tbody></table></div>';
  const DEMO = '<div class="data-wrap"><table class="data official"><caption>Demografie der Weltbevölkerung</caption><thead>' +
    '<tr><th class="rowhead">Kontinent</th><th>Fläche (km²)</th><th>Bevölkerung (Mio.)</th><th>Prozentsatz der in Städten lebenden Bevölkerung</th><th>Anzahl Länder</th></tr></thead><tbody>' +
    [['Afrika', '30 065 000', '877,5', '36', '53'], ['Asien', '44 579 000', '3 879,0', '34', '44'], ['Europa', '9 938 000', '727,0', '74', '46'],
      ['Nordamerika', '24 256 000', '501,5', '79', '23'], ['Südamerika', '17 819 000', '379,5', '82', '12']]
      .map((r) => '<tr><th class="rowhead" scope="row">' + r[0] + '</th>' + r.slice(1).map((c) => '<td>' + c + '</td>').join('') + '</tr>').join('') +
    '</tbody></table></div>';
  const NONE = 'Keine der oben genannten';
  const N = [
    [FUE, 'Wie war im Jahr 2000 das Verhältnis des niederländischen BIP zum finnischen BIP?', ['1:3', '2:3', '3:2', '3:1', NONE], 3,
      'BIP = FuE-Ausgaben ÷ FuE-Anteil am BIP. Niederlande: 6 075 ÷ 0,0182 ≈ 333 800 Mio. €. Finnland: 3 725 ÷ 0,0334 ≈ 111 500 Mio. €. Verhältnis ≈ 2,99 : 1, also 3:1 (D). Falle: Das BIP pro Kopf (21 003 zu 21 582) beantwortet die Frage nicht, weil die Einwohnerzahl fehlt.'],
    [FUE, 'Wie war im Jahr 2000 in etwa das Verhältnis des deutschen BIP zum französischen BIP?', ['1:3', '2:3', '3:2', '3:1', NONE], 2,
      'Deutschland: 41 100 ÷ 0,0245 ≈ 1 677 600 Mio. €. Frankreich: 24 075 ÷ 0,0215 ≈ 1 119 800 Mio. €. Verhältnis ≈ 1,50 : 1 = 3:2 (C).'],
    [FUE, 'Um welchen Prozentsatz haben sich die öffentlichen FuE-Ausgaben in Deutschland zwischen 2000 und 2003 erhöht, wenn das deutsche BIP in diesem Zeitraum um 2 % gewachsen ist?', ['1,35 %', '2,20 %', '3,25 %', '4,25 %', NONE], 3,
      'Öffentliche FuE-Ausgaben = BIP × FuE-Quote × öffentlicher Anteil. Faktor 2003 zu 2000: 1,02 × (2,52 ÷ 2,45) × (31,2 ÷ 31,4) = 1,02 × 1,0286 × 0,9936 ≈ 1,0425, also +4,25 % (D). Schneller Weg: nur die drei Wachstumsfaktoren multiplizieren, absolute Werte braucht man nicht.'],
    [FUE, 'Um welchen Prozentsatz haben sich die öffentlichen FuE-Ausgaben in Belgien zwischen 2000 und 2003 erhöht, wenn das belgische BIP in diesem Zeitraum um 3 % gewachsen ist?', ['1,11 %', '1,21 %', '1,31 %', '1,41 %', NONE], 3,
      'Faktor: 1,03 × (1,89 ÷ 1,97) × (23,5 ÷ 22,9) = 1,03 × 0,9594 × 1,0262 ≈ 1,0141, also +1,41 % (D). Die FuE-Quote sinkt, der öffentliche Anteil und das BIP steigen.'],
    [DEMO, 'Wie groß (in km²) sind Nord- und Südamerika zusammen?', ['42 015 000', '42 075 000', '42 135 000', '42 195 000', '42 255 000'], 1,
      '24 256 000 + 17 819 000 = 42 075 000 km² (B). Die Optionen liegen nur 60 000 auseinander – hier zählt sauberes Addieren der letzten Stellen (256 + 819 = 1 075).'],
  ];

  // ---------- Abstraktes Denken (SVG-Nachzeichnungen) ----------
  function box(inner) {
    return '<svg class="fig" viewBox="0 0 100 100" aria-hidden="true"><rect x="1.5" y="1.5" width="97" height="97" fill="#fff" stroke="#111" stroke-width="2"/>' + inner + '</svg>';
  }
  // offener Pfeil (Linie mit zwei Schenkeln), von (x1,y1) nach (x2,y2)
  function arrowOpen(x1, y1, x2, y2) {
    const a = Math.atan2(y2 - y1, x2 - x1), L = 9, w = 0.5;
    const p1 = [x2 - L * Math.cos(a - w), y2 - L * Math.sin(a - w)], p2 = [x2 - L * Math.cos(a + w), y2 - L * Math.sin(a + w)];
    return '<path d="M' + x1 + ' ' + y1 + 'L' + x2 + ' ' + y2 + 'M' + p1[0].toFixed(1) + ' ' + p1[1].toFixed(1) + 'L' + x2 + ' ' + y2 + 'L' + p2[0].toFixed(1) + ' ' + p2[1].toFixed(1) + '" stroke="#111" stroke-width="2.2" fill="none" stroke-linecap="round"/>';
  }
  // Pfeil mit gefüllter Spitze
  function arrowSolid(x1, y1, x2, y2) {
    const a = Math.atan2(y2 - y1, x2 - x1), L = 10, w = 0.42;
    const bx = x2 - L * 0.8 * Math.cos(a), by = y2 - L * 0.8 * Math.sin(a);
    const p1 = [x2 - L * Math.cos(a - w), y2 - L * Math.sin(a - w)], p2 = [x2 - L * Math.cos(a + w), y2 - L * Math.sin(a + w)];
    return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + bx.toFixed(1) + '" y2="' + by.toFixed(1) + '" stroke="#111" stroke-width="2"/>' +
      '<path d="M' + x2 + ' ' + y2 + 'L' + p1[0].toFixed(1) + ' ' + p1[1].toFixed(1) + 'L' + p2[0].toFixed(1) + ' ' + p2[1].toFixed(1) + 'Z" fill="#111"/>';
  }
  const ring = (x, y, r) => '<circle cx="' + x + '" cy="' + y + '" r="' + (r || 5.5) + '" fill="#fff" stroke="#111" stroke-width="2"/>';
  const dot = (x, y, r) => '<circle cx="' + x + '" cy="' + y + '" r="' + (r || 5) + '" fill="#111"/>';
  const cross = (x, y) => '<path d="M' + (x - 4) + ' ' + (y - 4) + 'L' + (x + 4) + ' ' + (y + 4) + 'M' + (x + 4) + ' ' + (y - 4) + 'L' + (x - 4) + ' ' + (y + 4) + '" stroke="#111" stroke-width="2"/>';
  const tri = (x, y) => '<path d="M' + x + ' ' + (y - 9) + 'L' + (x + 9) + ' ' + (y + 7) + 'L' + (x - 9) + ' ' + (y + 7) + 'Z" fill="#fff" stroke="#111" stroke-width="2"/>';

  // Aufgabe 16: Pfeil dreht sich um 90° gegen den Uhrzeigersinn und wandert nach unten
  const F16 = [arrowOpen(72, 16, 27, 16), arrowOpen(73, 16, 73, 61), arrowOpen(51, 50, 96, 50), arrowOpen(72, 86, 72, 41), arrowOpen(72, 84, 27, 84)];
  const O16 = [arrowOpen(73, 16, 73, 61), arrowOpen(72, 16, 27, 16), arrowOpen(27, 55, 27, 10), arrowOpen(27, 50, 27, 95), arrowOpen(5, 50, 50, 50)];

  // Aufgabe 17: Streifen „\“, Kreuz und Kreis wandern auf der Diagonale von rechts oben nach links unten
  const P = [[90, 10], [74, 26], [58, 42], [42, 58], [26, 74], [10, 90]];
  const stripes = [-60, -20, 20, 60].map((c) => {
    // Linie y = x + c innerhalb des Quadrats
    const x1 = Math.max(0, -c), x2 = Math.min(100, 100 - c);
    return '<line x1="' + (x1 + 1.5) + '" y1="' + (x1 + c + 1.5) + '" x2="' + (x2 - 1.5) + '" y2="' + (x2 + c - 1.5) + '" stroke="#111" stroke-width="1.8"/>';
  }).join('');
  const f17 = (xp, op) => stripes + cross(P[xp][0] + 3, P[xp][1] - 3) + ring(P[op][0] - 3, P[op][1] + 3, 5);
  const F17 = [f17(0, 3), f17(1, 2), f17(1, 0), f17(2, 1), f17(2, 3)];
  const O17 = [f17(2, 4), f17(2, 3), f17(3, 4), f17(3, 2), stripes + ring(P[3][0], P[3][1], 5) + cross(P[3][0], P[3][1])];

  // Aufgabe 18: Punkt auf dem Rand, zwei verschränkte Reihen
  const F18 = [dot(8, 50), dot(8, 8), dot(8, 92), dot(50, 8), dot(50, 92)];
  const O18 = [dot(92, 50), dot(8, 92), dot(92, 92), dot(92, 8), dot(50, 8)];

  // Aufgabe 19: 2×2-Raster, getauscht wird reihum oben – links – unten – rechts
  const grid = '<path d="M50 1.5V98.5M1.5 50H98.5" stroke="#111" stroke-width="2"/>';
  const cellXY = [[25, 25], [75, 25], [25, 75], [75, 75]];
  const sym = { o: (x, y) => ring(x, y, 9), t: tri, d: (x, y) => dot(x, y, 5) };
  const f19 = (cells) => grid + cells.split('').map((c, i) => (c === '_' ? '' : sym[c](cellXY[i][0], cellXY[i][1]))).join('');
  const F19 = ['otd_', 'tod_', 'dot_', 'do_t', 'dt_o'].map(f19);
  const O19 = ['odt_', 't_od', 'd_to', 'td_o', 'tod_'].map(f19);

  // Aufgabe 20: Kreis wandert im Uhrzeigersinn durch die Ecken, Pfeilrichtung pendelt um „links“ mit wachsendem Ausschlag
  const C = { tl: [14, 14], tr: [86, 14], br: [86, 86], bl: [14, 86] };
  const dirArrow = (deg) => {
    const a = (deg * Math.PI) / 180, r = 36;
    const dx = Math.cos(a) * r, dy = -Math.sin(a) * r;
    return arrowSolid(+(50 - dx).toFixed(1), +(50 - dy).toFixed(1), +(50 + dx).toFixed(1), +(50 + dy).toFixed(1));
  };
  const f20 = (deg, c) => dirArrow(deg) + ring(C[c][0], C[c][1], 6);
  const F20 = [f20(180, 'tl'), f20(135, 'tr'), f20(225, 'br'), f20(90, 'bl'), f20(270, 'tl')];
  const O20 = [f20(225, 'br'), f20(225, 'bl'), f20(45, 'tr'), f20(0, 'tr'), dirArrow(45) + ring(20, 80, 6)];

  const ABS = [
    [F16, O16, 3, 'Der Pfeil dreht sich von Bild zu Bild um 90° gegen den Uhrzeigersinn (links – unten – rechts – oben – links); als Nächstes zeigt er nach unten. Gleichzeitig wandert er Schritt für Schritt vom oberen zum unteren Rand. Nur D zeigt einen nach unten gerichteten Pfeil im unteren Bereich; A hat die richtige Richtung, steht aber oben.'],
    [F17, O17, 2, 'Nummeriert man die Plätze auf der Diagonale von rechts oben (0) nach links unten, steht das Kreuz auf 0, 1, 1, 2, 2 – es rückt nur in jedem zweiten Bild vor, im sechsten also auf 3. Der Kreis springt abwechselnd um ein und zwei Plätze und kehrt an der Ecke um: 3, 2, 0, dann 1, 3 – als Nächstes 4. Kreuz auf 3 und Kreis auf 4 zeigt nur C.'],
    [F18, O18, 3, 'Zwei verschränkte Reihen: Die Bilder 1, 3, 5 zeigen den Punkt links Mitte, links unten, unten Mitte; die Bilder 2 und 4 zeigen ihn links oben und oben Mitte. Beide Reihen laufen am Rand entlang ein Achtel weiter. Bild 6 gehört zur zweiten Reihe, der Punkt steht also rechts oben (D).'],
    [F19, O19, 3, 'In jedem Schritt tauschen zwei benachbarte Felder ihren Inhalt. Das getauschte Paar wandert reihum: obere Zeile, linke Spalte, untere Zeile, rechte Spalte – danach wieder die obere Zeile. Tauscht man in Bild 5 die beiden oberen Felder, ergibt sich D (Dreieck links oben, Punkt rechts oben, Kreis rechts unten).'],
    [F20, O20, 2, 'Der Kreis wandert im Uhrzeigersinn von Ecke zu Ecke (links oben, rechts oben, rechts unten, links unten, links oben) – als Nächstes rechts oben. Der Pfeil pendelt um die Richtung „links“ mit wachsendem Ausschlag: 0°, +45°, −45°, +90°, −90°, als Nächstes +135°, also nach rechts oben. Beides erfüllt nur C.'],
  ];

  const L = ['A', 'B', 'C', 'D', 'E'];
  const out = [];
  V.forEach((v, i) => out.push({
    id: 'off-v-' + (i + 1), section: 'verbal', source: 'official', sourceLabel: SRC, officialNo: i + 1,
    topic: v[0], passage: v[1], stem: STEM_V, options: v[2], correct: v[3], explanation: v[4], fixedOrder: true,
  }));
  N.forEach((n, i) => out.push({
    id: 'off-n-' + (i + 1), section: 'numerical', source: 'official', sourceLabel: SRC, officialNo: 11 + i,
    data: n[0], stem: n[1], options: n[2], correct: n[3], explanation: n[4], fixedOrder: true,
  }));
  ABS.forEach((a, i) => out.push({
    id: 'off-a-' + (i + 1), section: 'abstract', source: 'official', sourceLabel: SRC, officialNo: 16 + i,
    data: '<div class="fig-series">' + a[0].map((f) => '<figure class="fig-cell">' + box(f) + '</figure>').join('') + '</div>',
    stem: '', options: a[1].map(box), optionsAreFigures: true, correct: a[2], explanation: a[3] + ' Richtig ist ' + L[a[2]] + '.', fixedOrder: true,
  }));

  root.EPSO_OFFICIAL = out;
  if (typeof module !== 'undefined') module.exports = out;
})(typeof window !== 'undefined' ? window : globalThis);
