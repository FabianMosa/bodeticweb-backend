-- MySQL dump 10.13  Distrib 8.0.42, for Win64 (x86_64)
--
-- Host: localhost    Database: bodega_tic
-- ------------------------------------------------------
-- Server version	8.0.43

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `movimiento`
--

DROP TABLE IF EXISTS `movimiento`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `movimiento` (
  `PK_id_movimiento` int NOT NULL AUTO_INCREMENT,
  `FK_id_insumo` int NOT NULL,
  `FK_id_usuario` int NOT NULL,
  `FK_id_ot` int DEFAULT NULL,
  `FK_id_documento` int DEFAULT NULL,
  `tipo_movimiento` enum('Entrada','Salida-Uso','Préstamo','Devolución') NOT NULL,
  `cantidad` int NOT NULL,
  `descripcion` varchar(250) DEFAULT NULL,
  `fecha_hora` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`PK_id_movimiento`),
  KEY `FK_id_insumo` (`FK_id_insumo`),
  KEY `FK_id_usuario` (`FK_id_usuario`),
  KEY `FK_id_ot` (`FK_id_ot`),
  KEY `FK_id_documento` (`FK_id_documento`),
  CONSTRAINT `movimiento_ibfk_1` FOREIGN KEY (`FK_id_insumo`) REFERENCES `insumo` (`PK_id_insumo`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `movimiento_ibfk_2` FOREIGN KEY (`FK_id_usuario`) REFERENCES `usuario` (`PK_id_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `movimiento_ibfk_3` FOREIGN KEY (`FK_id_ot`) REFERENCES `hoja_terreno` (`PK_id_ot`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `movimiento_ibfk_4` FOREIGN KEY (`FK_id_documento`) REFERENCES `documento_ingreso` (`PK_id_documento`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `movimiento`
--

LOCK TABLES `movimiento` WRITE;
/*!40000 ALTER TABLE `movimiento` DISABLE KEYS */;
INSERT INTO `movimiento` VALUES (1,4,2,NULL,7,'Entrada',2,NULL,'2026-01-02 15:48:53');
/*!40000 ALTER TABLE `movimiento` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-25 14:15:14
